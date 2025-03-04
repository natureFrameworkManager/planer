<?php
$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, "https://www.informatik.uni-leipzig.de/~stundenplan/modul.html");//"https://www.informatik.uni-leipzig.de/~stundenplan/archiv/24w/modul.html");
curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

$response_data = curl_exec($curl);
curl_close($curl);
echo $response_data;
?>