var DEBUG = false;

var App = {
	Countries: {},
	IndependentCountries: [],
	NonIndependentCountries: [],
	VisitedCountries: [],
	Regions: [],
	Map: {},

	onReady: function () {
		if (DEBUG) console.log("onReady");

		App.loadCountryData();
	},

	loadCountryData: function() {
		if (DEBUG) console.log("loadCountryData");

		$.getJSON("data/countries.json", function(data) {
		    JSON.stringify(data);
		}).done(function(countries) {
			if (DEBUG) console.log(countries);

			App.Countries = countries;
			for (var cca3 in App.Countries) {
				var country = App.Countries[cca3];
				var item = {cca3: cca3, name: country.name.common};

				if (country.independent === true) {
					App.IndependentCountries.push(item);
				} else {
					App.NonIndependentCountries.push(item);
				}

				if (country.custom.visited === true) {
					App.VisitedCountries.push(item);
				}

				if (country.independent === true && App.Regions.indexOf(country.region) < 0) {
					App.Regions.push(country.region);
				}
			}

			if (App.IndependentCountries) App.IndependentCountries.sort(App.sortByValue);
			if (App.NonIndependentCountries) App.NonIndependentCountries.sort(App.sortByValue);
			if (App.VisitedCountries) App.VisitedCountries.sort(App.sortByValue);
			if (App.Regions) App.Regions.sort();

			if (DEBUG) console.log("App.Countries");
			if (DEBUG) console.log(App.Countries);
			if (DEBUG) console.log("App.IndependentCountries");
			if (DEBUG) console.log(App.IndependentCountries);
			if (DEBUG) console.log("App.NonIndependentCountries");
			if (DEBUG) console.log(App.NonIndependentCountries);
			if (DEBUG) console.log("App.VisitedCountries");
			if (DEBUG) console.log(App.VisitedCountries);
			if (DEBUG) console.log("App.Regions");
			if (DEBUG) console.log(App.Regions);

			App.displayVisitedCount();
			App.displayMap();
			App.populateFilters();
			App.populateCountries();
		});
	},

	displayVisitedCount: function() {
		if (DEBUG) console.log("displayVisitedCount");

		var allCount = App.IndependentCountries ? App.IndependentCountries.length : 0;
		var visitedCount = App.VisitedCountries ? App.VisitedCountries.length : 0;

		var parent = $("#visitCount");
		var countChild = $("<span></span>").text("Visited: " + visitedCount + "/" + allCount + " ");
		var pieChild = $("<span></span>").addClass("pie").text(visitedCount + "/" + allCount);
		parent.append(countChild);
		parent.append(pieChild);

		$("span.pie").peity("pie", {
			fill: ["#502F7E", "#EEB200"]
		});
	},

	updateVisitedCount: function() {
		if (DEBUG) console.log("updateVisitedCount");

		$("#visitCount").empty();
		App.displayVisitedCount();
	},

	displayMap: function() {
		if (DEBUG) console.log("displayMap");

		var nonIndependentData = {};
		var visitedData = {};

		if (App.NonIndependentCountries) {
			nonIndependentData = App.NonIndependentCountries.reduce(function(map, item) {
				map[item.cca3] = {fillKey: "nonIndependentFill"};
				return map;
			}, {});
		}

		if (App.VisitedCountries) {
			visitedData = App.VisitedCountries.reduce(function(map, item) {
				map[item.cca3] = {fillKey: "visitedFill"};
				return map;
			}, {});
		}

		App.Map = new Datamap({
			element: document.getElementById("map"),
			responsive: true,
			fills: {
                defaultFill: "#EEB200",
				nonIndependentFill: "#6C757D",
				visitedFill: "#502F7E"
            },
			geographyConfig: {
				hideAntarctica: false,
				borderWidth: 1,
				borderColor: "#FDFDFD",
				popupOnHover: true,
				popupTemplate: function(geography, data) {
					var country = geography.id;
					return "<div class='hoverinfo'><strong>" + geography.properties.name + "</strong></div>";
				},
				highlightOnHover: true,
				highlightFillColor: "#946EC9",
				highlightBorderColor: "#FDFDFD",
				highlightBorderWidth: 1
			},
			data: Object.assign(nonIndependentData, visitedData)
		});
	},

	updateMap: function(cca3, visited) {
		if (DEBUG) console.log("updateMap");

		var fillKey = "visitedFill";
		if (!visited) {
			if (App.Countries[cca3].independent) {
				fillKey = "defaultFill";
			} else {
				fillKey = "nonIndependentFill";
			}
		}

		var mapUpdate = {};
		mapUpdate[cca3] = {fillKey: fillKey};

		App.Map.updateChoropleth(mapUpdate);
	},

	populateCountries: function() {
		if (DEBUG) console.log("populateCountries");

		var table = $("table tbody");

		for (var i = 0; i < App.IndependentCountries.length; i++) {
			var item = App.IndependentCountries[i];
			var country = App.Countries[item.cca3];

			var row = $("<tr></tr>").attr("data-region", country.region).attr("data-visited", country.custom.visited).attr("data-cca3", country.cca3);
			var name = $("<td></td>").text(country.flag + " " + country.name.common);
			var region = $("<td></td>").text(country.region);
			var badge = $("<span></span>").addClass("badge");
			if (country.custom.visited) {
				badge.text("Yes")
				badge.addClass("active");
			} else {
				badge.text("No")
			}
			var visited = $("<td></td>").append(badge);

			row.append(name);
			row.append(region);
			row.append(visited);
			table.append(row);
		}

		$(".badge").on("click", App.markVisited);
	},

	populateFilters: function() {
		if (DEBUG) console.log("populateFilters");

		for (var i = 0; i < App.Regions.length; i++) {
			var region = App.Regions[i];
			var button = $("<button></button>").addClass("btn btnbtn-sm btn-secondary").attr("data-region", region).text(region);
			$("#regionFilters").append(button);
		}

		$("#visitedFilters").append($("<button></button>").addClass("btn btnbtn-sm btn-secondary").attr("data-visited", "true").text("Visited"));
		$("#visitedFilters").append($("<button></button>").addClass("btn btnbtn-sm btn-secondary").attr("data-visited", "false").text("Not visited"));

		$(".btn-group .btn").on("click", App.filterTable);
	},

	filterTable: function() {
		if (DEBUG) console.log("filterTable");

		if ($(this).hasClass("active")) {
			$(this).removeClass("active");
		} else {
			$(this).addClass("active");
			$(this).siblings(".active").removeClass("active");
		}

		var regionFilterValue = $("#regionFilters .btn.active").attr("data-region");
		var visitedFilterValue = $("#visitedFilters .btn.active").attr("data-visited");

		var table = $("table tbody tr");
		for (var i = 0; i < table.length; i++) {
			var row = $(table[i]);
			var rowRegion = row.attr("data-region");
			var rowVisited = row.attr("data-visited");

			var showRowBasedOnRegion = false;
			var showRowBasedOnVisited = false;

			if (regionFilterValue === undefined || regionFilterValue === rowRegion) {
				showRowBasedOnRegion = true;
			}

			if (visitedFilterValue === undefined || visitedFilterValue === rowVisited) {
				showRowBasedOnVisited = true;
			}

			if (showRowBasedOnRegion && showRowBasedOnVisited) {
				row.show();
			} else {
				row.hide();
			}
		}
	},

	markVisited: function() {
		if (DEBUG) console.log("markVisited");

		var badge = $(this);
		var row = $(this).parent().parent();
		var cca3 = row.attr("data-cca3");
		var visited = !$(this).hasClass("active");

		$.ajax({
			type: "POST",
			url: "data/countries.php",
			data: {
				cca3: cca3,
				visited: visited
			}
		}).done(function(result) {
			console.log(result);
			if (DEBUG) console.log(App.Countries);
			if (visited) {
				App.Countries[cca3].custom.visited = true;
				badge.text("Yes");
				badge.addClass("active");
				row.attr("data-visited", "true")
			} else {
				App.Countries[cca3].custom.visited = false;
				badge.text("No");
				badge.removeClass("active");
				row.attr("data-visited", "false")
			}

			var removeIndex = -1;
			for (var i = 0; i < App.VisitedCountries.length; i++) {
				if (App.VisitedCountries[i].cca3 === cca3) {
					if (!visited) {
						removeIndex = i;
						break;
					}
				}
			}

			if (removeIndex > -1) {
				App.VisitedCountries.splice(removeIndex, 1);
			} else {
				App.VisitedCountries.push({cca3: cca3, name: App.Countries[cca3].name.common});
				App.VisitedCountries.sort(App.sortByValue);
			}

			App.updateVisitedCount();
			App.updateMap(cca3, removeIndex < 0);
		});
	},

	sortByValue: function(first, second) {
		if (DEBUG) console.log("sortByValue");

		return first.name.localeCompare(second.name);
	}
}

$(document).ready(App.onReady);

$(window).on("resize", function() {
	App.Map.resize();
});
