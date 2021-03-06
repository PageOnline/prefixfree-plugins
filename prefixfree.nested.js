(function() {
	if(!window.StyleFix || !window.PrefixFree) {
		return;
	}

	StyleFix.register(function(css) {

		css = css.replace(/\/\*(.|[\r\n])*?\*\//g, '');
		css = css.replace(/\{/g, '{;');

		var parseCSS = function(str) {
			if(str.indexOf('keyframes') != -1 || str.indexOf('media') != -1) {
				return { outer: str, inner: '', response: false };
			}

			var brackets = 0,
				selector = '',
				nestedSelector = '',
				tempString = '',
				outerString = '',
				innerString = '',
				character = '',
				response = false;

			for(var i = 0; i < str.length; ++i) {
				character = str[i];
				tempString += str[i];
				
				switch(character) {
					case ';':
						if(brackets < 2) {
							outerString += tempString;
						} else {
							innerString += tempString;
						}
						tempString = '';
						break;
					case '{':
						if(brackets == 0) {
							selector = tempString.replace(/\{/g, '');
						} else if(brackets == 1) {
							nestedSelector = tempString;
							tempString = selector + tempString;
							tempString = tempString.replace(/\s+/g, ' ');
							response = true;
						} else if(brackets > 2) {
							response = true;
							if(tempString != nestedSelector) {
								innerString += tempString;
							}
							tempString = '';
						} else {
							if(tempString != nestedSelector) {
								innerString += tempString;
							}
							tempString = '';
						}
						brackets += 1;
						break;
					case '}':
						brackets -= 1;
						if(brackets == 0) {
							outerString += '\n}';
							tempString = '';
						} else {
							innerString += '\n}';
							tempString = '';
						}
						break;
				}
			}
			
			if(innerString != '') {
				innerString = innerString.replace(/^\s/, ' ');
			}
			return { outer: outerString, inner: innerString, response: response };
		}

		var nested = {
			arr: [],
			str: '',
			rule: ''
		};

		var character = ' ',
			brackets = 0,
			write = true;

		for(var i = 0; i < css.length; ++i) {
			character = css[i];
			nested.rule += css[i];

			switch(character) {
				case ';':
					nested.str = '';
					break;
				case '{':
					brackets += 1;
					break;
				case '}':
					brackets -= 1;
					if(brackets == 0) {
						nested.arr.push(nested.rule);
						nested.rule = '';
					}
					break;
			}

			nested.str += character;
		}

		var newCSS = '',
			rule,
			prom,
			result,
			isMedia,
			temp = [],
			tempCSS = '';

		for(var i = 0; i < nested.arr.length; ++i) {
			rule = nested.arr[i];
			if(/@(-webkit-|-ms-|-o-|-moz-)?media/.test(rule)) {
				rule.replace(/(@(-webkit-|-ms-|-o-|-moz-)?media.*\{;)([\s\S]*)(})/, function($1, $2, $3, $4, $5) {
					temp[0] = $2;
					temp[1] = $5;
					rule = $4;
				});
				isMedia = true;
			} else {
				isMedia = false;
			}
			prom = parseCSS(rule);
			tempCSS += prom.outer;
			result = prom.response;
			while(result) {
				prom = parseCSS(prom.inner);
				tempCSS += prom.outer;
				result = prom.response;
			}
			tempCSS += prom.inner;
			if(isMedia) {
				tempCSS = temp[0] + tempCSS + temp[1];
			}
			newCSS += tempCSS;
			tempCSS = '';
		}

		newCSS = newCSS.replace(/\s*&\s*/g, '');
		newCSS = newCSS.replace(/\n\s+(.*;)/g, function($0, $1) { return '\n    ' + $1 });
		newCSS = newCSS.replace(/\}\n*/g, '}\n\n');
		newCSS = newCSS.replace(/\{;+\n?/g, '{\n');
		//document.body.innerHTML += '<pre>' + newCSS + '</pre>';
		return newCSS;
	});
})();
