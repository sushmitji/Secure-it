
/*
 * This is the file that pops up when the user activates the extension to interact with it.
 */


var pass = {
  /**
   * Converts hexadecimal to base64
   */
  HexToBase64: function(string) {
		return btoa(string.match(/\w{2}/g).map(function(a){return String.fromCharCode(parseInt(a,16));}).join(""));
	},
	
  /**
   * The algorithm:
	 * (1) Append the site & phrase with a vertical bar, like "facebook | hello world"
	 * (2) Hash using SHA256 (separate downloaded file)
	 * (3) Convert hexed output to base64
	 * (4) Use only the first 16 characters (some websites set upper limits on length)
	 * Results in a 64x16= 1024-bit password
   */
  hash: function() {
		// get phrase & site
    var phrase = document.getElementById("hash_phrase").value;
    var site = document.getElementById("hash_site").value;
		var plaintext = site + ' | ' + phrase;
		
	// don't do any work if the field is empty
		if ((phrase.length > 0) | (site.length > 0)) {
			// show show/hide icon
			document.getElementById('showhide').style.display = 'inline';
		
			// Encourage passphrase to be
			// longer than 10 characters
			phrase_len = phrase.length;
			bg = "";
			if (phrase_len < 10) {
				bg = "white";
			} else {
				bg = "yellow";
			}
			document.getElementById('hash_result').style.color = bg;
			
			// hash away
			var ciphertext = SHA256(plaintext);
			ciphertext = this.HexToBase64(ciphertext);
			ciphertext = ciphertext.substring(0,16);
			
			// display result
			document.getElementById('hash_result').innerHTML = ciphertext;
		} else {
			// hide show/hide icon, clear result
			document.getElementById('showhide').style.display = 'none';
			document.getElementById('hash_result').innerHTML = '';
		}
  },
  
	/**
	 * When user clicks on the result, send ciphertext down to the content script,
	 * and initialize all inputs
	 */
  insert: function(word) {
		var msg = { action: 'insert_text', pass: word };
		if (word.length > 0) {
			if ((typeof(chrome) != "undefined") && (typeof(chrome.extension) != "undefined"))
				chrome.extension.sendMessage(msg, function(response){});
			else
				window.prompt("Copy to clipboard: Ctrl+C, Enter", word);
		}
	},

	/**
	* short utility functions
	*/
	toggle: function() {
		var type = document.getElementById('hash_phrase').type;
		
		var show = (type == 'password');
		var fieldtype = show ? 'text': 'password';
		var imgsrc    = show ? 'hide20.png': 'show20.png';
		var imgtitle  = show ? 'Hide': 'Show';
		
		document.getElementById('hash_phrase').type = fieldtype;
		document.getElementById('showhide').src = imgsrc;
		document.getElementById('showhide').title = imgtitle+' Passphrase Alt+S';
	},
	init: function(which) {
		this.toggle('hide');
		document.getElementById('hash_result').innerHTML = '';
		document.getElementById('hash_phrase').value = '';
		document.getElementById('showhide').style.display = 'none';
		
		if (which == 'visible') {
			document.addEventListener('keydown', pass.listen);
			if (document.getElementById('hash_site').disabled)
				document.getElementById('hash_phrase').focus();
			else
				document.getElementById('hash_site').focus();
		} else {
			// 1.2 remove listeners!
			document.removeEventListener('keydown', pass.listen);
		}
	},
	
	listen: function(e) {
		var key = e.keyCode;
		if (key == 13) { /* enter */
			var word = document.getElementById("hash_result").innerHTML;
			pass.insert(word);
		} else if (e.altKey & (key == 83)) { /* alt+s */
			pass.toggle();
		} else if (key == 27) { /* esc */
			// 1.2 tell content script to close qtip
			if ((typeof(chrome) != "undefined") && (typeof(chrome.extension) != "undefined")) {
				chrome.extension.sendMessage(
					{ action: 'close' },
					function(response){}
				);
			}
		}
	}
};

fill_site = function (result) {
	var hash_site = document.getElementById('hash_site');
	var hash_phrase = document.getElementById('hash_phrase');
	var hash_pipe = document.getElementById('hash_pipe');

	//console.log(result);
	site = result.site;
	domain = result.domain;
	icon = result.icon;

	// populate inputs
	if (result.site) {
		hash_site.value = site;
		hash_site.size = site.length;
		hash_phrase.size = 19 - site.length;
	} else {
		hash_site.size = 8;
		hash_phrase.size = 11;
	}

	if (icon == "") {
		icon = "http://www.google.com/s2/favicons?domain=http://www."+domain;
	}
	hash_site.style.backgroundImage = "url('"+icon+"')";
	hash_site.style.backgroundRepeat = "no-repeat";
	hash_site.style.backgroundSize = "contain";
	hash_site.style.paddingLeft = "20px";
}

/**
 * On load, add listeners
 * 
 */
document.addEventListener('DOMContentLoaded', function() {
	
	// refresh output at every keystroke, the algorithm is plenty fast, no need for a "submit" button
	var hash_click = document.getElementById('hash_phrase');
	hash_click.addEventListener('keyup', function() {
		pass.hash();
	});
	var hash_site = document.getElementById('hash_site');
	hash_site.addEventListener('keyup', function() {
		pass.hash();
	});

	// tab out of site triggers icon lookup
	hash_site.addEventListener('blur', function() {
		var info = { 'site': this.value, 'domain':this.value + '.com', 'icon':'' };
		fill_site(info);
	});

	// make the result text clickable, click to insert, again, saving a button
	var hash_insert = document.getElementById('hash_insert');
	hash_insert.addEventListener('click', function() {
		var word = document.getElementById('hash_result').innerHTML;
		pass.insert(word);
	});
	
	// retrieve website / domain ("facebook"/"facebook.com") from local storage
	if ((typeof(chrome) != "undefined") && (typeof(chrome.storage) != "undefined")) {
		chrome.storage.sync.get(['site','domain','icon'], fill_site);
	} else {
		var info = { 'site': '', 'domain':'', 'icon':'' };
		fill_site(info);
		hash_site.removeAttribute("disabled");
	}

	/**
	* Show/hide password toggle
	*/
	document.getElementById('showhide').addEventListener('click', function() {
		pass.toggle();
	});
	
	// autofocus passphrase
	pass.init();
});


window.addEventListener('message',function(e) {
	if (e.data.visible) { /* on qtip show */
		pass.init('visible');
	}
	if (e.data.hidden) { /* on qtip hide */
		pass.init('hidden');
	}
});
