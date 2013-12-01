<?php

define("LIST_FILE", "./ftse");

$tm = time();
$lastTm = 0;

if (file_exists(LIST_FILE)) {
  $lastTm = filemtime(LIST_FILE);
}

$list = '';
$ch = curl_init();

// Get a new list if the file is more than a day old
if ($tm - $lastTm > 86400) {

  $urls = array('http://uk.finance.yahoo.com/q/cp?s=%5EFTSE', 'http://uk.finance.yahoo.com/q/cp?s=%5EFTSE&c=1',
		'http://uk.finance.yahoo.com/q/cp?s=%5EFTSE&c=2');

  $symbol_list = array();
  
  @unlink(LIST_FILE);
  
  foreach ($urls as $url) {
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // grab URL and pass it to the browser
    $response = curl_exec($ch);
    
    // Parse the response into a list
    unset($matches);
    
    preg_match_all('>([A-Z]+\.L)</a>', $response, $matches);
    
    if (is_array($matches[1])) {
      $list .= implode(',', $matches[1]) . ',';
    }
  }
  file_put_contents(LIST_FILE, $list);

} else {
  $list = file_get_contents(LIST_FILE);
}

// var_export($list);

curl_setopt($ch, CURLOPT_URL, "http://download.finance.yahoo.com/d/quotes.csv?s=$list&f=snl1c1p2&e=.csv");
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// grab URL and pass it to the browser
$response = curl_exec($ch);

// var_export($response);

curl_close($ch);

// Number of dummy slices to make the donut chart
// looks like start in 60 and end in 120 degrees
define("NUM_EMPTY_SLICES", 3);

$search = array('"', '%');

$lines = explode("\n", $response);
foreach ($lines as $ln) {
	$fields = explode(",", $ln);
  unset($stock);
  $stock['symbol'] = trim($fields[0], '"');
  $stock['name'] = trim($fields[1], '"');
  $stock['price'] = floatval($fields[2]);
  $stock['change'] = floatval($fields[3]);

  // Sometimes Yahoo returns invalid stock result with percent as "N/A"
  // and floatval translates it to 0
  // So we only filter the one with numerical value
  $percent = str_replace($search, '', trim($fields[4]));
  if (is_numeric($percent)) {
    $stock['percent'] = floatval($percent);
  } else {
    continue;
  }

  $ftse[] = $stock;
}

// Reverse sort
function cmp_percent($a, $b) {
    if ($a['percent'] == $b['percent']) {
        return 0;
    }
    return ($a['percent'] < $b['percent']) ? 1 : -1;
}

/***
 * Sort the share order in terms of percent change
 */
usort($ftse, 'cmp_percent');

// var_export($ftse);

$data = array();
for ($i = 0; $i < NUM_EMPTY_SLICES; $i++) {
  $data[] = array('y' => 1,
                  'name' => null
                  );
}
foreach ($ftse as $stock) {
   $data[] = array('y' => 1, // Equal distribution
                   'name' => ucwords(strtolower($stock['name'])),
                   'percent' => $stock['percent'],
                   'change' => $stock['change'],
                   'price' => $stock['price']
                   );
}
for ($i = 0; $i < NUM_EMPTY_SLICES; $i++) {
  $data[] = array('y' => 1,
                  'name' => null
                  );
}
if (count($data) % 2) {
  $data[] = array('y' => 1,
                  'name' => null
                  );
}

echo "var data = " . json_encode($data) . ";\n";

?>