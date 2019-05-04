<?php
	$file = dirname(__FILE__) . "/countries.json";
	$cca3 = $_POST["cca3"];
	$visited = $_POST["visited"];

	$countries = json_decode(file_get_contents($file), true);
	$countries[$cca3]["custom"]["visited"] = ($visited === "true");

	file_put_contents($file, json_encode($countries));
