var map;
var MyApp = function () { };

MyApp.Proxy = "proxy.ashx?";

MyApp.GoogleData = "http://spreadsheets.google.com/feeds/list/0AqqhS68oSTV5dDlCWlRPUnNSalNvRUpFMWNZTUtqRGc/1/public/basic?alt=json-in-script&callback=LoadGoogleFeatures";

function init() {
    map = new OpenLayers.Map({
        div: "map",
        projection: "EPSG:900913",
        displayProjection: "EPSG:4326"
    });

    layer = new OpenLayers.Layer.OSM("Simple OSM Map");

    map.addLayer(layer);

    map.addControl(new OpenLayers.Control.MousePosition());

    MyApp.Vector = new OpenLayers.Layer.Vector("POI", {
        //projection: new OpenLayers.Projection("EPSG:4326"), //map.getProjectionObject(),
        //strategies: [new OpenLayers.Strategy.Fixed()],
        preFeatureInsert: function (feature) {
            feature.geometry.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
        },
        styleMap: new OpenLayers.StyleMap({
            temporary: OpenLayers.Util.applyDefaults({}, OpenLayers.Feature.Vector.style.temporary),
            'default': OpenLayers.Util.applyDefaults({
                labelAlign: "lm",
                labelXOffset: 7,
                labelYOffset: 7,
                label: "${name}"
            }, OpenLayers.Feature.Vector.style['default']),
            select: OpenLayers.Util.applyDefaults({}, OpenLayers.Feature.Vector.style.select)
        })

    });
    //, { projection: "EPSG:4326" }
    MyApp.LoadVector();
    console.log(MyApp.Vector);
    map.addLayer(MyApp.Vector);
    console.log(MyApp.Vector);
    map.zoomToMaxExtent();
}

MyApp.LoadVector = function () {
    console.log("LoadVector");
    //var features2 = new Array();
    if (MyApp.RawFeatures) {
        var gg = new Array();
        for (var i = 0; i < MyApp.RawFeatures.length; i++) {
            var p = new OpenLayers.Geometry.Point(MyApp.RawFeatures[i].longitude, MyApp.RawFeatures[i].latitude);
            var f = new OpenLayers.Feature.Vector(p, MyApp.RawFeatures[i]);
            gg.push(f);
        }
        MyApp.Vector.removeAllFeatures();
        MyApp.Vector.addFeatures(gg);
        //MyApp.Vector.refresh({ force: true });
    }
}

MyApp.ReloadVector = function () {
    MyApp.RawFeatures = undefined;
    $.getScript(MyApp.GoogleData)
        .done(function (data) {
            console.log("script reload done");
            MyApp.LoadVector();
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
}

function LoadGoogleFeatures(root) {
    console.log("LoadGoogleFeatures");
    var feed = root.feed;
    var entries = feed.entry || [];
    var features = new Array();

    for (var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        console.log(entry.content.$t);
        var attr = entry.content.$t.split(",");
        var feature = new Object();
        for (var j = 0; j < attr.length; j++) {
            var pp = attr[j].split(":");
            feature[pp[0].trim()] = pp[1].trim();
        }
        features.push(feature);
    }
    MyApp.RawFeatures = features;
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
                     setTimeout(function () {
                         MyApp.ReloadVector();
                     }, 2500);
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