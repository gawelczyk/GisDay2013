var map;
var MyApp = function () { };

function init() {
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913",
        displayProjection: "EPSG:4326"
    });

    layer = new OpenLayers.Layer.OSM("Simple OSM Map");

    map.addLayer(layer);
    map.zoomToMaxExtent();

    map.addControl(new OpenLayers.Control.MousePosition());
}

$(function () {
    init();
});