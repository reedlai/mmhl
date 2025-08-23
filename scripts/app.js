(function(){
	"use strict";

	// No query params policy
	try{
		window.addEventListener("pageshow", function(e){
			if(e && e.persisted){ location.reload(); }
		});
	}catch(_){}

	// Version
	var BASE_VERSION = "1.0";
	var version = BASE_VERSION + ".dev";
	var short_sha = "dev";

	// Load license data from JSON
	var LICENSE_DATA = null;
	function loadData(){
		return fetch("./data/license.json", {cache:"no-store"})
			.then(function(r){ if(!r.ok) throw new Error(String(r.status)); return r.json(); })
			.then(function(j){ LICENSE_DATA = j; });
	}

	// Random hex
	function hex6(){
		var chars = "0123456789abcdef";
		if(window.crypto && crypto.getRandomValues){
			var arr = new Uint8Array(6), s = "";
			crypto.getRandomValues(arr);
			for(var i=0;i<6;i++){ s += chars.charAt(arr[i] & 15); }
			return s;
		}
		var h = "";
		for(var j=0;j<6;j++){ h += chars.charAt((Math.random()*16)|0); }
		return h;
	}

	// Version UI
	function setVersionUI(){
		var vcore = document.getElementById("ver_core");
		var vl = document.getElementById("ver_left");
		var vr = document.getElementById("ver_right");
		if(vcore){ vcore.textContent = "MMHL v" + version; }
		if(vl){ vl.textContent = short_sha.slice(0,3) || "ver"; }
		if(vr){ vr.textContent = short_sha.slice(-3) || "dev"; }
	}
	function fetchLatestSha(){
		var api = "https://api.github.com/repos/reedlai/mmhl/commits?per_page=1&_=" + Date.now();
		return fetch(api, {cache:"no-store", headers: {"Accept":"application/vnd.github+json"}})
			.then(function(r){ if(!r.ok){ throw new Error(String(r.status)); } return r.json(); })
			.then(function(arr){
				if(arr && arr.length){
					short_sha = String(arr[0].sha || "").slice(0,7);
					version = BASE_VERSION + "." + (short_sha || "dev");
				}
			})
			.catch(function(){})
			.finally(setVersionUI);
	}

	// Renderers
	function renderColloquial(){
		var host = document.getElementById("colloquial_body");
		if(!host || !LICENSE_DATA) return;
		host.innerHTML = LICENSE_DATA.colloquial_lines.map(function(line){
			return "<p>" + line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</p>";
		}).join("");
	}
	function renderFormal(){
		if(!LICENSE_DATA) return;
		var intro = document.getElementById("formal_intro");
		var cond = document.getElementById("formal_condition");
		var list = document.getElementById("formal_list");
		var outro = document.getElementById("formal_outro");
		if(intro){ intro.textContent = LICENSE_DATA.formal_intro; }
		if(cond){ cond.textContent = LICENSE_DATA.formal_condition; }
		if(list){
			list.innerHTML = "";
			for(var i=0;i<LICENSE_DATA.formal_items.length;i++){
				var li = document.createElement("li");
				li.textContent = LICENSE_DATA.formal_items[i];
				list.appendChild(li);
			}
		}
		if(outro){ outro.textContent = LICENSE_DATA.formal_outro + " 😉"; }
	}

	// Builders
	function getLicenseHeader(){ return "MMHL version " + version; }
	function getLicenseText(){
		if(!LICENSE_DATA) return "";
		var parts = [];
		parts.push(getLicenseHeader(), "");
		parts.push(LICENSE_DATA.title, "");
		parts.push("Colloquial:");
		parts = parts.concat(LICENSE_DATA.colloquial_lines, "");
		parts.push("Formalized:");
		parts.push(LICENSE_DATA.formal_intro);
		parts.push(LICENSE_DATA.formal_condition);
		for(var i=0;i<LICENSE_DATA.formal_items.length;i++){
			parts.push(String(i+1) + ") " + LICENSE_DATA.formal_items[i]);
		}
		parts.push("", LICENSE_DATA.formal_outro, LICENSE_DATA.slogan);
		return parts.join("\n");
	}
	function getLicenseMarkdown(){
		if(!LICENSE_DATA) return "";
		var lines = [];
		lines.push("### " + LICENSE_DATA.title + " — v" + version, "");
		lines.push("> " + LICENSE_DATA.colloquial_lines[0]);
		if(LICENSE_DATA.colloquial_lines[1]) lines.push("> " + LICENSE_DATA.colloquial_lines[1]);
		lines.push("", "Formalized", "");
		lines.push(LICENSE_DATA.formal_intro, "");
		lines.push("- " + LICENSE_DATA.formal_condition);
		for(var i=0;i<LICENSE_DATA.formal_items.length;i++){
			lines.push("	- " + LICENSE_DATA.formal_items[i]);
		}
		lines.push("", "_" + LICENSE_DATA.slogan + "_");
		return lines.join("\n");
	}
	function getSpdxHeader(style){
		var line = "SPDX-License-Identifier: LicenseRef-MMHL-" + BASE_VERSION;
		if(style === "hash"){ return "# " + line; }
		if(style === "html"){ return "<!-- " + line + " -->"; }
		return "/* " + line + " */";
	}

	// Clipboard
	function toast(msg){
		var s = document.getElementById('copied');
		if(s){ s.textContent = msg; setTimeout(function(){ s.textContent = ""; }, 1500); }
	}
	function copyText(txt){
		if(navigator.clipboard && navigator.clipboard.writeText){
			navigator.clipboard.writeText(txt).then(function(){ toast("Copied."); });
			return;
		}
		var ta = document.createElement('textarea');
		ta.value = txt; ta.style.position='fixed'; ta.style.opacity='0';
		document.body.appendChild(ta); ta.select();
		try{ document.execCommand('copy'); }catch(_){}
		document.body.removeChild(ta);
		toast("Copied.");
	}

	// Stamp copy buttons
/*
	function addStampCopyButtons(){
		var stamps = document.getElementsByClassName("stamp");
		for(var i=0;i<stamps.length;i++){
			var el = stamps[i];
			if(el.nextSibling && el.nextSibling.nodeType === 1 && el.nextSibling.className.indexOf("copy-stamp") !== -1){
				continue;
			}
			var btn = document.createElement("button");
			btn.setAttribute("type","button");
			btn.setAttribute("class","copy-stamp");
			btn.setAttribute("aria-label","Copy this logo");
			btn.setAttribute("title","Copy");
			btn.textContent = "📋";
			btn.onclick = (function(target){
				return function(){
					var pre	= (target.getElementsByClassName("pre")[0]	|| {textContent:""}).textContent;
					var core = (target.getElementsByClassName("core")[0] || {textContent:""}).textContent;
					var post = (target.getElementsByClassName("post")[0] || {textContent:""}).textContent;
					var parts = [];
					if(pre){ parts.push(pre); }
					if(core){ parts.push(core); }
					if(post){ parts.push(post); }
					var text = parts.join(" ");
					copyText(text);
				};
			})(el);
			if(el.parentNode){ el.parentNode.insertBefore(btn, el.nextSibling); }
		}
	}
*/




function addStampCopyButtons(){
	var stamps = document.getElementsByClassName("stamp");

	function animateCopyButton(btn){
		btn.classList.remove("icon-copy");
		btn.classList.add("icon-check");
		setTimeout(function(){
			btn.classList.remove("icon-check");
			btn.classList.add("icon-copy");
		}, 1200);
	}

	for(var i=0;i<stamps.length;i++){
		var el = stamps[i];
		if(el.nextSibling && el.nextSibling.nodeType === 1 &&
			 (el.nextSibling.className || "").indexOf("icon-btn") !== -1){
			continue;
		}
		var btn = document.createElement("button");
		btn.setAttribute("type","button");
		btn.setAttribute("class","copy-stamp icon-btn icon-copy");
		btn.setAttribute("aria-label","Copy this logo");
		btn.setAttribute("title","Copy");
		btn.innerHTML = '<span class="sr">Copy</span>';

		btn.onclick = (function(target, button){
			return function(){
				var pre	= (target.getElementsByClassName("pre")[0]	|| {textContent:""}).textContent;
				var core = (target.getElementsByClassName("core")[0] || {textContent:""}).textContent;
				var post = (target.getElementsByClassName("post")[0] || {textContent:""}).textContent;
				var parts = [];
				if(pre){ parts.push(pre); }
				if(core){ parts.push(core); }
				if(post){ parts.push(post); }
				var text = parts.join(" ");
				copyText(text);
				animateCopyButton(button);
			};
		})(el, btn);

		if(el.parentNode){ el.parentNode.insertBefore(btn, el.nextSibling); }
	}
}







	// Shuffle
	function shuffleStamps(){
		var stamps = document.getElementsByClassName('stamp');
		for(var i=0;i<stamps.length;i++){
			var pre = stamps[i].getElementsByClassName('pre')[0];
			var post = stamps[i].getElementsByClassName('post')[0];
			if(pre){ pre.textContent = hex6(); }
			if(post){ post.textContent = hex6(); }
		}
	}

	// Digest
	function toHex(buf){
		var arr = Array.from(new Uint8Array(buf));
		return arr.map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
	}
	async function renderDigest(){
		if(!(window.crypto && crypto.subtle)) return;
		var txt = getLicenseText();
		var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
		var hex = toHex(buf);
		var slot = document.getElementById("digest_core");
		if(slot){ slot.textContent = "sha256:" + hex.slice(0,12); }
		try{ console.log("MMHL sha256(full):", hex); }catch(_){}
	}

	// Actions
	function canonicalURL(){ return location.origin + location.pathname; }
	function makePermalink(){ copyText(canonicalURL()); toast("Permalink ready."); }
	function sharePage(){
		var url = canonicalURL();
		if(navigator.share){
			navigator.share({title:"MMHL", text:"Make Me Happy License", url:url}).catch(function(){});
		}else{
			copyText(url);
		}
		toast("Link ready.");
	}
	function downloadLicense(){
		var blob = new Blob([getLicenseText()], {type:"text/plain;charset=utf-8"});
		var a = document.createElement('a');
		a.download = "LICENSE.txt";
		a.href = URL.createObjectURL(blob);
		a.rel = "noopener";
		document.body.appendChild(a);
		a.click();
		setTimeout(function(){
			URL.revokeObjectURL(a.href);
			document.body.removeChild(a);
		}, 500);
	}

	// Shortcuts
	document.addEventListener("keydown", function(ev){
		if(ev.target && (/input|textarea/i).test(ev.target.tagName)) return;
		var k = ev.key;
		if(k === "s" || k === "S") shuffleStamps();
		if(k === "c" || k === "C") copyText(getLicenseText());
		if(k === "m" || k === "M") copyText(getLicenseMarkdown());
		if(k === "x" || k === "X") copyText(getSpdxHeader("slash"));
		if(k === "p" || k === "P") makePermalink();
		if(k === "d" || k === "D") downloadLicense();
	});

	// Init: load data first
	function init(){
		renderColloquial();
		renderFormal();
		addStampCopyButtons();
		shuffleStamps();
		fetchLatestSha().then(renderDigest);
	}

	loadData().then(init);
	document.getElementById("shuffle").addEventListener("click", shuffleStamps);
	document.getElementById("copy_plain").addEventListener("click", function(){ copyText(getLicenseText()); });
	document.getElementById("copy_md").addEventListener("click", function(){ copyText(getLicenseMarkdown()); });
	document.getElementById("copy_spdx").addEventListener("click", function(){ copyText(getSpdxHeader("slash")); });
	document.getElementById("permalink").addEventListener("click", makePermalink);
	document.getElementById("share").addEventListener("click", sharePage);
	document.getElementById("download").addEventListener("click", downloadLicense);
})();

