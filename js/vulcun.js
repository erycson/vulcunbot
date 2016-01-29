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

var firebase = new Firebase('https://burning-fire-6807.firebaseio.com');
var username;
var token;
var league;
var tab_id;

function sendJackpotEntry(data) {
    $.post('https://vulcun.com/api/jackpotentry', data);
}

function addJackpotItem(item, callback) {
    chrome.storage.local.get('jackpotList', function(data) {
        var items = data.jackpotList;
        var removed;

        if (items.length == 100) {
            var temp = items.splice(1);
            removed  = items;
            items    = temp;
        }

        items.push(item);
        chrome.storage.local.set({
            jackpotList: items
        }, callback);
    });
}

function addJackpotItemWon(item, callback) {
    chrome.storage.local.get('jackpotWon', function(data) {
        var items = data.jackpotWon;
        var removed;

        if (items.length == 100) {
            var temp = items.splice(1);
            removed  = items;
            items    = temp;
        }

        items.push(item);
        chrome.storage.local.set({
            jackpotWon: items
        }, callback);
    });
}

function showNotification(title, message) {
    chrome.notifications.create('jackpot-error', {
        type: 'basic',
        iconUrl: 'img/favicon.png',
        title: title,
        message: message
    });
}

/*
{
    classid: (int),         // ID do item para pegar a imagem: https://steamcommunity-a.akamaihd.net/economy/image/class/730/{classid}/180fx90f
    hash: (string),         // hash == winner.oldhash
    game: (int),            // 1 = CS:GO
    itemid: (string),       // Secret
    image: (int),           // ID do item na steam
    itemname: (string),     // nome do usuário que ganhou
    price: (float),         // valor do item em dolar segundo a steam
    seconds: (int),         // duração do jackpot
}
*/
firebase.child('jackpot/jackpots').on('child_added', function(e) {
    var jackpot = e.val();

    addJackpotItem(jackpot, function() {
        console.log('New jackpot with price %s and name "%s"', parseFloat(jackpot.price).toLocaleString('en-US', { style: "currency", currency: "USD" }), jackpot.itemname);
    });
});

/*
{
    hash: (string),         // NewHash
    oldhash: (string),      // OldHash
    secret: (string),       // Secret
    image: (string),        // imagem do item vindo da steam
    winnername: (string),   // nome do usuário que ganhou
    type: (string),         // timpo de mensagem
    price: (int),           // total apostado
    percentage: (float),    // chances que ele tinha para ganahr
    winnerprice: (int)      // quanto o usuário pagou
}
*/
firebase.child("jackpot/action").limitToLast(1).on("child_added", function(e) {
    var winner = e.val();
    if (winner.type != 'won' || !winner.winnername)
        return;
    if (!username)
        return;


    if (username == winner.winnername) {
        addJackpotItemWon(winner, function() {
            console.log('You won "%s"', winner.itemname);
            chrome.notifications.create('jackpot-congratulations', {
                type: 'basic',
                iconUrl: 'img/favicon.png',
                title: 'Congratulations',
                message: 'You won "' + winner.itemname + '"'
            });
        });
    }
    else {
        console.log('The user "%s" won "%s" by the amount of "%d"', winner.winnername, winner.itemname, winner.winnerprice);
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if (request.type == 'user-info' && request.username != username) {
        showNotification('Success', 'You are logged in');
        username = request.username;
        token    = request.token;
        league   = request.league;
    }
    else if (request.type == 'error') {
        showNotification('Error', response.message);
    }

    if (tab_id == sender.tab.id) {
        // User not logged
        if (!username) {
            showNotification('Error', 'Please log in vulcun for bot work.');
        }
        // User already logged in, close the tab
        else  {
            chrome.tabs.remove(tab_id);
        }
    }


    callback({});
});

chrome.tabs.create({
    url: 'https://vulcun.com/',
    active: false,
    selected: false
}, function(tab) {
    tab_id = tab.id;
});
