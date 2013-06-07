/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) {return callback(err);}

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            elm.className = 'photo';
            elm.appendChild(img);
            
            // Create the Favorite button
            var favBtn = document.createElement('span');
            var imgSrc = img.src;
            var cookieName = 'fav';
            
            // Apply the favorite icon class to the button
            if(getCookieVal(cookieName).indexOf(imgSrc)=='-1'){
                favBtn.className = 'icon-heart-empty';
            } else {
                favBtn.className = 'icon-heart';                
            }
            
            favBtn.onclick = toggleFav;
            elm.appendChild(favBtn);
            
            holder.appendChild(elm);
        };
    }
    
    /**
     * Switch Favorite status
     *
     */
    function toggleFav(){
        
        if($(this).attr('class')=='icon-heart-empty'){
            
            // If is not favorite yet, add the image to favorites :
            
            $(this).removeClass('icon-heart-empty');
            $(this).addClass('icon-heart');
            var cookieName = 'favorites';
            var imgSrc = $(this).siblings('img').attr('src');
            
            // Append the image src attribute to the string and update the cookie value
            if(document.cookie){
                if(getCookieVal(cookieName).indexOf(imgSrc)=='-1'){
                    var cookieVal = getCookieVal(cookieName)+imgSrc;
                    setCookie(cookieName,cookieVal);                    
                }
            } else {
                var cookieVal = imgSrc;
                setCookie(cookieName,cookieVal);
            }            
            
        } else {
            
            // If is favorite, remove the image from favorites :
            
            $(this).removeClass('icon-heart');
            $(this).addClass('icon-heart-empty');

            var cookieName = 'favorites';
            var imgSrc = $(this).siblings('img').attr('src');

            if(document.cookie){
                if(getCookieVal(cookieName).indexOf(imgSrc)!=='-1'){
                    var cookieVal = getCookieVal(cookieName);
                    var favPos = cookieVal.indexOf(imgSrc);
                    var favLen = imgSrc.length;
                    var strLen = cookieVal.length;
                    cookieVal = cookieVal.substring(0,favPos)+cookieVal.substring(favPos+favLen,strLen);
                    setCookie(cookieName,cookieVal);
                }
            }
            
        }
        
    // console.log(document.cookie);
        
    }
    
    /**
     * Set Cookie
     */
    function setCookie(cookieName,cookieVal){
        document.cookie = cookieName + "=" + cookieVal + "; path=/";        
    }
    
    /**
     * Get Cookie Value
     */
    function getCookieVal(cookieName){
        var strStart = document.cookie.indexOf(cookieName+"=");
        var cookieNameLen = cookieName.length+1;
        var strEnd = document.cookie.length;
        var cookieVal = document.cookie.substring(strStart+cookieNameLen,strEnd);
        return cookieVal;
    }

    // ----
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) {return callback(err);}

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };
}(jQuery));
