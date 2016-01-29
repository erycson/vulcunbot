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

var query = document.querySelectorAll('header a.dropdown-toggle');

// not logged
if (query.length == 1) {
    chrome.runtime.sendMessage({
        type: 'error',
        message: 'Not logged'
    });
}
else
{
    console.log('jackpot bot loaded');

    var username = query.item(query.length - 1).innerText;
    var token    = document.querySelector('input[name="_token"]').value;
    var league   = 0; //document.querySelector('input[name="league"]').value;

    // send logged user info
    chrome.runtime.sendMessage({
        type: 'user-info',
        username: username,
        token: token,
        league: league
    });
}
