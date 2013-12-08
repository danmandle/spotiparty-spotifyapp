require(['$api/models'], function(models) {

    // When application has loaded, run tabs function
    // models.application.load('arguments').done(tabs);

    // When arguments change, run tabs function
    models.application.addEventListener('arguments', tabs);

    function tabs() {
        var args = models.application.arguments;
        var current = window.location.replace(args[0]);
    }
});