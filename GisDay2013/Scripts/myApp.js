var map;
var MyApp = function () { };

MyApp.Proxy = "proxy.ashx?";


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

    $("#google-form").submit(function () {
        try {
            var url1 = $(this).attr("action");
            console.log(url1);

            $.ajax({
                type: "POST",
                url: MyApp.Proxy + url1,
                global: false,
                crossDomain: true,
                data: $(this).serialize(),
            })
             .done(function (data) {
                 console.log(data);
                 var resp = $(data).find(".ss-custom-resp");
                 console.log($(resp).html());
                 if (resp.length == 0 || $(resp).html() != "Your response has been recorded.") {
                     //message error
                     bootbox.dialog({
                         message: "Saving POI failed",
                         className: "alert-warning", buttons: {
                             error: { label: "Close!", className: "btn-warning" }
                         }
                     });
                 } else {
                     //message ok
                     bootbox.dialog({
                         message: "POI saved sucessfully",
                         className: "alert-success", buttons: {
                             success: { label: "Success!", className: "btn-success" }
                         }
                     });
                 };
             })
             .fail(function (data, textStatus, errorThrown) {
                 console.error(data);
                 console.log(data.getAllResponseHeaders());
                 console.error(errorThrown);
                 //message error
                 bootbox.dialog({
                     message: "Saving POI failed </br>" + textStatus,
                     className: "alert-warning", buttons: {
                         error: { label: "Close!", className: "btn-warning" }
                     }
                 });
             });          

        } catch (e) {
            console.log(e);
            bootbox.dialog({
                message: "Error: " + e,
                className: "alert-warning", buttons: {
                    error: { label: "Closa", className: "btn-warning" }
                }
            });
        }
        return false;
    });

});