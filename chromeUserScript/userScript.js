// ==UserScript==
// @name         Tinder Driver V2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *tinder.com/*
// @grant unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      self
// @connect      herokuapp.com
// @require http://code.jquery.com/jquery-1.12.4.min.js
// ==/UserScript==

//var serverUrl = 'you heroku?';
var serverUrl = 'http://localhost:3000';
var pollRate = 1000;

(function() {
    'use strict';

    $('head').append('<style>#bamboozle { position: fixed; bottom: 0 }</style>');
    $('body').append('<div id="bamboozle">...</div>');


    callHome();

    function callHome() {
        $('#bamboozle').text('sending update...');

        var image = $('.recCard.active .recCard__img')[0];

        var bio = $('.profileCard__bio ')[0];
        bio = bio ? bio : $('.profileCard__info ')[0];

        var desc = (bio && bio.children[0]) ? bio.children[0].textContent : '';

        var data = {
            name: $('.recCard.active .recCard__name').text(),
            imageUrl: image ? image.style.backgroundImage.replace('url(','').replace(')','').replace(/\"/gi, "") : null,
            desc: desc
        };

        console.log('sending: ');
        console.log(data);
        GM_xmlhttpRequest({
            method: "POST",
            data: JSON.stringify(data),
            url: serverUrl + '/controllerCallHome',
            headers: {'content-type':'application/json'},
            onload: function(res) {
                console.log(res.responseText);
                if(res.responseText) clickButton(res.responseText);
                window.setTimeout(callHome, pollRate);
            },
            onfail: function() {
                $('#bamboozle').text('error');
            }
        });
    }

    var selectorMap = {
        "openProfile": '.recCard__openProfile',
        "closeProfile": '.profileCard__backArrow',
        "like": 'button.recsGamepad__button--like',
        "dislike": 'button.recsGamepad__button--dislike',
    };

    function clickButton(action) {
        var button = $(selectorMap[action]);
        if(button) button.click();
    }
})();