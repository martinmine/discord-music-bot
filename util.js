exports.inArray = function (needle, haystack) {
    for (var i = 0; i < haystack.length; i++) {
        if (haystack[i] === needle) {
            return i;
        }
    }

    return false;
};

