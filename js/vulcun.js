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
var tab_id;
var jackpotPort;
var lootdropPort;

function getGamesWithChannel(callback) {
    $.post('https://vulcun.com/api/gameswithchannel', function(t) {
        var games = {};

        $.each(t.data.games, function() {
            $.each(this, function(name) {
                $.each(this, function() {
                    games[this.league_id] = {
                        game_id: this.id,
                        game_name: this.game_name,
                        id: this.league_id,
                        name: this.name,
                        status: this.status
                    };
                });
            });
        });

        callback(games);
    }, 'json');
}

function addJackpotItem(item, callback) {
    chrome.storage.local.get('jackpotList', function(data) {
        var items;
        var removed;

        if (data.jackpotList) {
            items = data.jackpotList;

            if (Object.keys(items).length == 100) {
                var temp = items.splice(1);
                removed     = items;
                items    = temp;
            }
        } else {
            items = [];
        }
  
        //removed;
        
        items.push(item);
        chrome.storage.local.set({
            jackpotList: items
        });
        callback();
    });
}

function addJackpotItemWon(item, callback) {
    chrome.storage.local.get('jackpotWon', function(data) {
        var items;
        var removed;

        if (data.jackpotWon) {
            items = data.jackpotWon;

            if (items.length == 100) {
                var temp = items.splice(1);
                removed  = items;
                items    = temp;
            }
        } else {
            items = [];
        }
  
        //removed;
        
        items.push(item);
        chrome.storage.local.set({
            jackpotWon: items
        }, function() {
          callback();
        });
    });
}

function saveGamesWithChannel(items, callback) {
    chrome.storage.local.set({
        gamesWithChannel: items
    }, callback);
}

function getGamesWithChannelInfo(league_id, callback) {
    chrome.storage.local.get('gamesWithChannel', function(data) {
        callback(data.gamesWithChannel);
    });
}

function showNotification(type, title, message) {
    chrome.notifications.create(type, {
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
        
        if (!jackpotPort)
            return;
        
        jackpotPort.postMessage({
            action: 'jackpot-entry'
        });
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
            showNotification('jackpot-congratulations', 'Congratulations', 'You won "' + winner.itemname + '"');
        });
    }
    else {
        console.log('The user "%s" won "%s" by the amount of "%d"', winner.winnername, winner.itemname, winner.winnerprice);
    }
});

// Loot vai começar
firebase.child("endtime/").on("child_added", function(snap) {
	  var league_id = snap.key();
	  
	  if (!lootdropPort)
	      return;
	  
    lootdropPort.postMessage({
        action: 'lootdrop-entry',
        league_id: league_id
    });
});

function checkLootdropWinners() {
    var winnersdir = "winners/" + getFormattedDate(0);
    firebase.child(winnersdir).orderByChild("endtime").limitToLast(1).on("child_added", function(snap) {
        var result = snap.val();

        if (!username)
            return;

        getGamesWithChannelInfo(result.league_id, function(league) {
            $.each(result.drops, function() {
                if (this.username == username) {
                    showNotification('jackpot-congratulations', 'Congratulations', 'You won [' + this.drop.name + '] "' + this.drop.description + '"');
                }
            });
        });
    });
}

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name == 'jackpot' && !jackpotPort) {
        jackpotPort = new Jackpot(port);
    }
});

function Jackpot(port) {
    var self = this;
  
    this.onUserInfo = function(name) {
        username = name;
        showNotification('jackpot-success', 'Success', 'You are logged in');
    };
    
    this.postMessage = function(data) {
        console.log('Jackpot.postMessage', data);
        port.postMessage(data);
    };
  
    port.onMessage.addListener(function(data) {
        if (data.action == 'user-info' && data.username != username) {
            self.onUserInfo(data.username);
        }
        else if (data.action == 'error') {
            showNotification('jackpot-error', 'Error', response.message);
        }
    });
}

chrome.tabs.create({
    url: 'https://vulcun.com/user/jackpot',
    active: false,
    selected: false
}, function(tab) {
    tab_id = tab.id.toString();
});

setInterval(function() {
    getGamesWithChannel(function(games) {
        saveGamesWithChannel(games, function() {
            console.log('Game with channel updated');
        });
    });
}, 60 * 60 * 1000); // 1 hour

setInterval(checkLootdropWinners, 60 * 60 * 12 * 1000); // 12 hours
