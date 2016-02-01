/*
 * Vulcun Bot
 * Copyright (C) 2016  Érycson Nóbrega <egdn2004@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
var port  = chrome.runtime.connect({name: "jackpot"});
var query = $('header a.dropdown-toggle');
var username;
 
function isLogged() {
    if (query.length == 1) {
        port.postMessage({
            action: 'error',
            message: 'Not logged'
        });
        return;
    }
    
    connect();
}
 
function connect() {
    username = query.last().text();
    
    // send logged user info
    port.postMessage({
        action: 'user-info',
        username: username
    }, function() {
        console.log('jackpot bot loaded');
    });
    
    port.onMessage.addListener(onMessage);
}

function onMessage(data) {
    console.log('onMessage', data);
    if (data.action == 'jackpot-entry') {
        onJackporEntry();
    }
}

function onJackporEntry() {
    console.log('onJackporEntry');
    
    $('input[name="deposit"]').val(0);
    $.post('https://vulcun.com/api/jackpotentry', $('#jackpot').serialize(), function() {
        console.log('Janckpot Entry');
    });
}
 
var isJackpotPage = document.URL.indexOf('https://vulcun.com/user/jackpot') >= 0;
if (isJackpotPage) {
    isLogged();
}
