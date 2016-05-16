exports.inArray = function (needle, haystack) {
    for (var i = 0; i < haystack.length; i++) {
        if (haystack[i] === needle) {
            return i;
        }
    }

    return false;
};

exports.containsElement = function (needle, haystack) {
    for (var i = 0; i < haystack.length; i++) {
        if (haystack[i] == needle) {
            return true;
        }
    }

    return false;
};

exports.formatTimestamp = function(unformattedTimestamp) {
    var times = unformattedTimestamp.split(':');
    var formattedTimestamp = '';

    for (var i = 0; i < times.length; i++) {
        if (times[i].length < 2) { // leading 0, as in 01
            formattedTimestamp += '0';
        }

        formattedTimestamp += times[i];

        if (i < times.length - 1) {
            formattedTimestamp += ':';
        }
    }

    if (times.length == 1) {
        formattedTimestamp = '00:' + formattedTimestamp;
    }

    return formattedTimestamp;
};