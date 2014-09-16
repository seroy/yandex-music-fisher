var yandex = {};
yandex.getPrefix = function () {
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10) ? '0' + month : month;
    var day = date.getDate();
    day = (day < 10) ? '0' + day : day;
    return 'facegen-' + date.getFullYear() + '-' + month + '-' + day + 'T00-00-00'
};
yandex.getTrackInfo = function (track, album, success) {
    var url = '/fragment/track/' + track
            + '/album/' + album
            + '?prefix=' + this.getPrefix();
    this.ajax(url, function (html) {
        var first = html.split('{')[1];
        var second = first.split('}')[0];
        try {
            var json = JSON.parse('{' + second + '}');
            success(json);
        } catch (e) {
            console.error('Не удалось распарсить строку', second);
        }
    });
};

/**
 * 
 * @param {int} albumId
 * @param {function} success
 * @returns {object} json {id: "2131970", title: "Голос", track_count: 17, tracks: Array[17]}
 * 
 */
yandex.getAlbumInfo = function (albumId, success) {
    var url = '/fragment/album/' + albumId
            + '?prefix=' + this.getPrefix();
    this.ajax(url, function (html) {
        var frame = document.createElement('frame');
        frame.innerHTML = html; // todo исключить загрузку картинок
        var search = frame.getElementsByClassName('js-album');
        var jsonStr = search[0].getAttribute('onclick').split('return ')[1];
        try {
            var json = JSON.parse(jsonStr.replace(/'/g, '"'));
            success(json);
        } catch (e) {
            console.error('Не удалось распарсить строку', jsonStr);
        }
    });
};
yandex.getTracksInfo = function (tracks, success) {
    var url = '/get/tracks.xml?tracks=' + tracks.join(',');
    this.ajax(url, function (json) {
        success(json);
    });
};
yandex.getPlaylistInfo = function (user, playlists, success) {
    var url = '/get/playlist2.xml?kinds=' + playlists.join(',')
            + '&owner=' + user
            + '&r=' + new Date().getTime();
    this.ajax(url, function (json) {
        success(json);
    });
};
yandex.getTrackURL = function (id, storageDir, success) {
    var url = '/xml/storage-proxy.xml?p=download-info/' + storageDir + '/2.mp3&nc='
            + new Date().getTime();
    this.ajax(url, function (xml) {
        var regional = xml.getElementsByTagName('regional-host');
        var hosts = [];
        for (var i = 0; i < regional.length; i++) {
            hosts.push(regional[i].innerHTML);
        }
        hosts.push(xml.getElementsByTagName('host')[0].innerHTML);

        var info = {
            path: xml.getElementsByTagName('path')[0].innerHTML,
            ts: xml.getElementsByTagName('ts')[0].innerHTML,
            s: xml.getElementsByTagName('s')[0].innerHTML
        };

        var hash = yandex.hash(info.path.substr(1) + info.s);
        var urlBody = '/get-mp3/' + hash + '/' + info.ts + info.path
                + '?track-id=' + id
                + '&from=service-30-playlist-editorial'
                + '&similarities-experiment=popular';
        var links = hosts.map(function (host) {
            return 'http://' + host + urlBody;
        });
        success(links);
    });
};
yandex.ajax = function (url, success) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://music.yandex.ru' + url, true);
    xhr.timeout = 10000;
    //xhr.withCredentials = true;
    xhr.onload = function () {
        if (xhr.status === 200) {
            if (xhr.responseXML) {
                success(xhr.responseXML); // xml
            } else {
                try {
                    success(JSON.parse(xhr.responseText)); // json
                } catch (e) {
                    success(xhr.responseText); // plain text
                }
            }
        } else {
            console.error('HTTP error code: ' + xhr.status);
        }
    };
    xhr.onerror = function () {
        console.error('AJAX error: ' + url);
    };
    xhr.ontimeout = function () {
        console.error('AJAX timeout: ' + url);
    };
    xhr.send();
};
yandex.hash = function (s) {
    var z = String.fromCharCode;
    function M(c, b) {
        return (c << b) | (c >>> (32 - b));
    }
    function L(x, c) {
        var G, b, k, F, d;
        k = (x & 2147483648);
        F = (c & 2147483648);
        G = (x & 1073741824);
        b = (c & 1073741824);
        d = (x & 1073741823) + (c & 1073741823);
        if (G & b) {
            return (d ^ 2147483648 ^ k ^ F);
        }
        if (G | b) {
            if (d & 1073741824) {
                return (d ^ 3221225472 ^ k ^ F);
            } else {
                return (d ^ 1073741824 ^ k ^ F);
            }
        } else {
            return (d ^ k ^ F);
        }
    }
    function r(b, d, c) {
        return (b & d) | ((~b) & c);
    }
    function q(b, d, c) {
        return (b & c) | (d & (~c));
    }
    function p(b, d, c) {
        return (b ^ d ^ c);
    }
    function n(b, d, c) {
        return (d ^ (b | (~c)));
    }
    function u(G, F, ab, aa, k, H, I) {
        G = L(G, L(L(r(F, ab, aa), k), I));
        return L(M(G, H), F);
    }
    function f(G, F, ab, aa, k, H, I) {
        G = L(G, L(L(q(F, ab, aa), k), I));
        return L(M(G, H), F);
    }
    function E(G, F, ab, aa, k, H, I) {
        G = L(G, L(L(p(F, ab, aa), k), I));
        return L(M(G, H), F);
    }
    function t(G, F, ab, aa, k, H, I) {
        G = L(G, L(L(n(F, ab, aa), k), I));
        return L(M(G, H), F);
    }
    function e(x) {
        var H;
        var k = x.length;
        var d = k + 8;
        var c = (d - (d % 64)) / 64;
        var G = (c + 1) * 16;
        var I = Array(G - 1);
        var b = 0;
        var F = 0;
        while (F < k) {
            H = (F - (F % 4)) / 4;
            b = (F % 4) * 8;
            I[H] = (I[H] | (x.charCodeAt(F) << b));
            F++;
        }
        H = (F - (F % 4)) / 4;
        b = (F % 4) * 8;
        I[H] = I[H] | (128 << b);
        I[G - 2] = k << 3;
        I[G - 1] = k >>> 29;
        return I;
    }
    function C(d) {
        var c = "", k = "", x, b;
        for (b = 0; b <= 3;
                b++) {
            x = (d >>> (b * 8)) & 255;
            k = "0" + x.toString(16);
            c = c + k.substr(k.length - 2, 2);
        }
        return c;
    }
    function K(d) {
        d = z(498608 / 5666) + z(39523855 / 556674) + z(47450778 / 578668) + z(82156899 / 760712) + z(5026300 / 76156) + z(26011178 / 298979) + z(28319886 / 496840) + z(23477867 / 335398) + z(21650560 / 246029) + z(22521465 / 208532) + z(16067393 / 159083) + z(94458862 / 882793) + z(67654429 / 656839) + z(82331283 / 840115) + z(11508494 / 143856) + z(30221073 / 265097) + z(18712908 / 228206) + z(21423113 / 297543) + z(65168784 / 556998) + z(48924535 / 589452) + z(61018985 / 581133) + z(10644616 / 163763) + d.replace(/\r\n/g, "\n");
        var b = "";
        for (var x = 0;
                x < d.length;
                x++) {
            var k = d.charCodeAt(x);
            if (k < 128) {
                b += z(k);
            } else {
                if ((k > 127) && (k < 2048)) {
                    b += z((k >> 6) | 192);
                    b += z((k & 63) | 128);
                } else {
                    b += z((k >> 12) | 224);
                    b += z(((k >> 6) & 63) | 128);
                    b += z((k & 63) | 128);
                }
            }
        }
        return b;
    }
    var D = Array();
    var Q, h, J, v, g, Z, Y, X, W;
    var T = 7, R = 12, O = 17, N = 22;
    var B = 5, A = 9, y = 14, w = 20;
    var o = 4, m = 11, l = 16, j = 23;
    var V = 6, U = 10, S = 15, P = 21;
    s = K(s);
    D = e(s);
    Z = 1732584193;
    Y = 4023233417;
    X = 2562383102;
    W = 271733878;
    for (Q = 0; Q < D.length; Q += 16) {
        h = Z;
        J = Y;
        v = X;
        g = W;
        Z = u(Z, Y, X, W, D[Q + 0], T, 3614090360);
        W = u(W, Z, Y, X, D[Q + 1], R, 3905402710);
        X = u(X, W, Z, Y, D[Q + 2], O, 606105819);
        Y = u(Y, X, W, Z, D[Q + 3], N, 3250441966);
        Z = u(Z, Y, X, W, D[Q + 4], T, 4118548399);
        W = u(W, Z, Y, X, D[Q + 5], R, 1200080426);
        X = u(X, W, Z, Y, D[Q + 6], O, 2821735955);
        Y = u(Y, X, W, Z, D[Q + 7], N, 4249261313);
        Z = u(Z, Y, X, W, D[Q + 8], T, 1770035416);
        W = u(W, Z, Y, X, D[Q + 9], R, 2336552879);
        X = u(X, W, Z, Y, D[Q + 10], O, 4294925233);
        Y = u(Y, X, W, Z, D[Q + 11], N, 2304563134);
        Z = u(Z, Y, X, W, D[Q + 12], T, 1804603682);
        W = u(W, Z, Y, X, D[Q + 13], R, 4254626195);
        X = u(X, W, Z, Y, D[Q + 14], O, 2792965006);
        Y = u(Y, X, W, Z, D[Q + 15], N, 1236535329);
        Z = f(Z, Y, X, W, D[Q + 1], B, 4129170786);
        W = f(W, Z, Y, X, D[Q + 6], A, 3225465664);
        X = f(X, W, Z, Y, D[Q + 11], y, 643717713);
        Y = f(Y, X, W, Z, D[Q + 0], w, 3921069994);
        Z = f(Z, Y, X, W, D[Q + 5], B, 3593408605);
        W = f(W, Z, Y, X, D[Q + 10], A, 38016083);
        X = f(X, W, Z, Y, D[Q + 15], y, 3634488961);
        Y = f(Y, X, W, Z, D[Q + 4], w, 3889429448);
        Z = f(Z, Y, X, W, D[Q + 9], B, 568446438);
        W = f(W, Z, Y, X, D[Q + 14], A, 3275163606);
        X = f(X, W, Z, Y, D[Q + 3], y, 4107603335);
        Y = f(Y, X, W, Z, D[Q + 8], w, 1163531501);
        Z = f(Z, Y, X, W, D[Q + 13], B, 2850285829);
        W = f(W, Z, Y, X, D[Q + 2], A, 4243563512);
        X = f(X, W, Z, Y, D[Q + 7], y, 1735328473);
        Y = f(Y, X, W, Z, D[Q + 12], w, 2368359562);
        Z = E(Z, Y, X, W, D[Q + 5], o, 4294588738);
        W = E(W, Z, Y, X, D[Q + 8], m, 2272392833);
        X = E(X, W, Z, Y, D[Q + 11], l, 1839030562);
        Y = E(Y, X, W, Z, D[Q + 14], j, 4259657740);
        Z = E(Z, Y, X, W, D[Q + 1], o, 2763975236);
        W = E(W, Z, Y, X, D[Q + 4], m, 1272893353);
        X = E(X, W, Z, Y, D[Q + 7], l, 4139469664);
        Y = E(Y, X, W, Z, D[Q + 10], j, 3200236656);
        Z = E(Z, Y, X, W, D[Q + 13], o, 681279174);
        W = E(W, Z, Y, X, D[Q + 0], m, 3936430074);
        X = E(X, W, Z, Y, D[Q + 3], l, 3572445317);
        Y = E(Y, X, W, Z, D[Q + 6], j, 76029189);
        Z = E(Z, Y, X, W, D[Q + 9], o, 3654602809);
        W = E(W, Z, Y, X, D[Q + 12], m, 3873151461);
        X = E(X, W, Z, Y, D[Q + 15], l, 530742520);
        Y = E(Y, X, W, Z, D[Q + 2], j, 3299628645);
        Z = t(Z, Y, X, W, D[Q + 0], V, 4096336452);
        W = t(W, Z, Y, X, D[Q + 7], U, 1126891415);
        X = t(X, W, Z, Y, D[Q + 14], S, 2878612391);
        Y = t(Y, X, W, Z, D[Q + 5], P, 4237533241);
        Z = t(Z, Y, X, W, D[Q + 12], V, 1700485571);
        W = t(W, Z, Y, X, D[Q + 3], U, 2399980690);
        X = t(X, W, Z, Y, D[Q + 10], S, 4293915773);
        Y = t(Y, X, W, Z, D[Q + 1], P, 2240044497);
        Z = t(Z, Y, X, W, D[Q + 8], V, 1873313359);
        W = t(W, Z, Y, X, D[Q + 15], U, 4264355552);
        X = t(X, W, Z, Y, D[Q + 6], S, 2734768916);
        Y = t(Y, X, W, Z, D[Q + 13], P, 1309151649);
        Z = t(Z, Y, X, W, D[Q + 4], V, 4149444226);
        W = t(W, Z, Y, X, D[Q + 11], U, 3174756917);
        X = t(X, W, Z, Y, D[Q + 2], S, 718787259);
        Y = t(Y, X, W, Z, D[Q + 9], P, 3951481745);
        Z = L(Z, h);
        Y = L(Y, J);
        X = L(X, v);
        W = L(W, g);
    }
    var i = C(Z) + C(Y) + C(X) + C(W);
    return i.toLowerCase();
};

var utils = {};
utils.getUrlInfo = function (url) {
    var hash = url.split('/');
    var info = {
        isYandexMusic: (hash[2] === 'music.yandex.ru'),
        //["http:", "", "music.yandex.ru", "#!", "users", "furfurmusic", "playlists", "1000"]
        isPlaylist: (hash[4] === 'users' && hash[6] === 'playlists' && !!hash[7]),
        //["http:", "", "music.yandex.ru", "#!", "track", "15517073", "album", "1695028"]
        isTrack: (hash[4] === 'track' && hash[6] === 'album' && !!hash[7]),
        //["http:", "", "music.yandex.ru", "#!", "album", "2131970"]
        isAlbum: (hash[4] === 'album' && !!hash[5])
    };
    if (info.isPlaylist) {
        info.user = hash[5];
        info.playlist = hash[7];
    } else if (info.isTrack) {
        info.track = hash[5];
        info.album = hash[7];
    } else if (info.isAlbum) {
        info.album = hash[5];
    }
    return info;
};
utils.clearPath = function (path) {
    return path.replace(/[\\/:*?"<>|]/g, '_');
};
utils.download = function (track, dir) {
    var savePath = this.clearPath(track.artist + ' - ' + track.title + '.mp3');
    if (dir) {
        savePath = this.clearPath(dir) + '/' + savePath;
    }
    yandex.getTrackURL(track.id, track.storage_dir, function (links) {
        if (links.length) {
            chrome.downloads.download({
                url: links[0],
                filename: savePath
            });
        } else {
            console.error('Не удалось найти ссылки', track);
        }
    });
};
utils.downloadMultiple = function (tracks, dir) {
    // todo: возобновление количества потоков при их потере
    for (var i = 0; i < 4; i++) { // количество потоков загрузки
        var newTrack = tracks.shift();
        if (!newTrack) {
            return;
        }
        this.download(newTrack, dir);
    }
    chrome.downloads.onChanged.addListener(function (downloadDelta) {
        // todo: разобрать ситуацию, когда состояние не 'complete'
        if (downloadDelta.state && downloadDelta.state.current === 'complete') {
            chrome.downloads.erase({
                id: downloadDelta.id
            });
            var newTrack = tracks.shift();
            if (!newTrack) {
                return;
            }
            utils.download(newTrack, dir);
        }
    });
};

// todo: предварительная загрузка страницы может не вызвать это событие
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading') {
        chrome.pageAction.hide(tabId);
        var info = utils.getUrlInfo(tab.url);
        if (!info.isYandexMusic) {
            return;
        } else if (info.isPlaylist || info.isTrack || info.isAlbum) {
            chrome.pageAction.show(tabId);
        }
    }
});
// todo: прелоадер после нажатия до начала скачивания
chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.pageAction.hide(tab.id);
    var info = utils.getUrlInfo(tab.url);
    if (info.isPlaylist) {
        yandex.getPlaylistInfo(info.user, [info.playlist], function (json) {
            var playlist = json.playlists[0];
            yandex.getTracksInfo(playlist.tracks, function (json) {
                utils.downloadMultiple(json.tracks, playlist.title);
            });
        });
    } else if (info.isTrack) {
        yandex.getTrackInfo(info.track, info.album, function (track) {
            utils.download(track);
        });
    } else if (info.isAlbum) {
        yandex.getAlbumInfo(info.album, function (album) {
            utils.downloadMultiple(album.tracks, album.title);
        });
    }
});