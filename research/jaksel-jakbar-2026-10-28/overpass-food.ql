[out:json][timeout:90][maxsize:67108864];
rel(id:5802438,7626001)->.cities;
.cities out geom;
.cities map_to_area->.scope;
(nwr(area.scope)["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"];nwr(area.scope)["shop"~"^(bakery|deli|confectionery|pastry|chocolate|coffee|tea)$"];)->.foods;
.foods out meta center;
.foods out count;
