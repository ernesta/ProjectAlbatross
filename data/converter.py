import codecs
import json

with codecs.open("countries.json", "r+", encoding="utf-8") as file:
    countryList = json.load(file)
    countryMap = {}

    for country in countryList:
      country["custom"] = {"visited": False}
      countryMap[country["cca3"]] = country

    file.seek(0)
    file.write(json.dumps(countryMap))
    file.truncate()
