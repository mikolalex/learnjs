var ctrlDown = false;
var ctrlKey = 17, vKey = 86, cKey = 67;

function escapeHtml(text) {
	var map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};

	return text.replace(/[&<>"']/g, function(m) {
		return map[m];
	});
}

var codes = [];
var ra = [];
var active_butt = false;

var fail = function(txt) {
	active_butt.find('.check').remove();
	$("<div />").addClass('check').addClass('error').text('Невірно' + (txt ? ': ' + txt : '')).css('opacity', 0).appendTo(active_butt).animate({opacity: 1}, 500);
	//active_butt.append('<div class="check error">Невірно</div>').delay(3000)//.find('.check-error').hide();
}
var normal = function(txt) {
	active_butt.find('.check').remove();
	if (txt)
		txt = txt
			.replace(/\&lt;/g, '<')
			.replace(/\&gt;/g, '>')
			.replace(/\&quot\;/g, '"')
			.replace(/\&#039\;/g, "'");
	$("<div />").addClass('check').addClass('normal').text((txt || 'Це дуже просто!')).css('opacity', 0).appendTo(active_butt).animate({opacity: 1}, 500);
	//active_butt.append('<div class="check error">Невірно</div>').delay(3000)//.find('.check-error').hide();
}
var success = function() {
	active_butt.find('.check').remove();
	$("<div />").addClass('check').addClass('success').text('Правильно!').css('opacity', 0).appendTo(active_butt).animate({opacity: 1}, 500);
}

var process_text = function(str) {

	var regs = [
		['\#\#\#([^\n^\r]*)', '<h1>$1</h1>'],
		['\#\#([^\n^\r]*)', '<h2>$1</h2>'],
		['\#([^\n^\r]*)', '<h3>$1</h3>'],
		['\n(\t*)\n(\t*)\n(\t*)\n', '<hr />'],
		['\\|([^\s^\|]{1,})\\|', '<b>$1</b>'],
		['@@@([^@]*)@@@', '<div class="block"><p>$1</p></div>'],
		['\\^([^\^]*)\\^([^\^]*)\\^', function(match, m1, m2) {
				return '<div><div class="bad"><pre><code class="">' + escapeHtml(m1) + '</code></pre></div> <div class="good"><pre><code class="">' + escapeHtml(m2) + '</code></pre></div><div style="clear:both;"></div></div>'
			}],
		['```(?:[\n]*)?([^`]*)(?:[\n]*)?```(\\?)?', function(match, m1, m2) {
				var str = '<pre><code class="">' + escapeHtml(m1) + '</code></pre>';
				if(m2){// show the result
					str += '<h4>Результат:</h4><div class="result example">' + m1 + '</div>';
				}
				return str;
			}],
		['\n\n\n', '</p><p>'],
		['\n\n', '<br><br>'],
		['\n\r\n', '<br><br>'],
		['\\?\\?\\?(.{1,3})?\\%([^\%]*)\\%(([^\%]*)\%)?', function(xxx, multiline, m1, m2, right_answer) {
				var inp = multiline ? '<textarea style="width:calc(100% - 100px);box-sizing:border-box;height:' + (multiline * 20) + 'px"></textarea>' : '<input type="text" placeholder="Введіть свій код сюди..." />';
				codes.push(m1);
				var height = multiline ? multiline * 20 : 30;
				ra.push(right_answer);
				var ind = codes.length - 1;
				return '<div class="test">' + inp + '<button style="height: ' + height + 'px;" type="check" data-i="' + ind + '">перевірити!</button><div style="clear:both;text-align:center"><a class="surrender" data-i="' + ind + '">Здаюсь, покажіть правильну відповідь</a></div></div>';
			}],
	]

	for (var i in regs) {
		var r = new RegExp(regs[i][0], 'g');
		str = str.replace(r, regs[i][1]);
	}


	return str;
}



$.get('text.txt', function(txt) {
	$(".wrapper").html(process_text(txt));
	$('code').each(function(i, block) {
		hljs.highlightBlock(block);
	});

	var toc = [];
	$(".wrapper h2, .wrapper h3").each(function(i) {
		var tag = $(this).prop('tagName');
		$(this).attr('id', 'chapter' + i);
		toc.push([tag, $(this).html()]);
	})

	var zmist = ['<li style="display: none;"><ul>'];// 

	for (var i = 1; i < toc.length; i++) {
		if (toc[i][0] === 'H2') {
			zmist.push('</ul></li><li><a href="#chapter' + i + '">' + toc[i][1] + '</a><ul>');
		} else {
			zmist.push('<li><a href="#chapter' + i + '">' + toc[i][1] + '</a></li>');
		}
	}

	zmist.push('</ul></li><li> ...далі буде</li>');
	$("#zmist").html(zmist.join(''));

	$(".wrapper").on('click', 'a.surrender', function() {
		var ind = $(this).attr('data-i');
		active_butt = $(this).closest('.test');
		normal(ra[ind]);

	})

	$(".wrapper").on('click', 'button[type=check]', function() {
		active_butt = $(this).parent();
		var ind = $(this).attr('data-i');
		var assert = codes[ind]
			.replace(/\&quot\;/g, '"')
			.replace(/\&#039\;/g, "'")
			.replace(/\&lt;/g, '<')
			.replace(/\&amp;/g, '&')
			.replace(/\&gt;/g, '>');
		var user_code = $(this).prev().val();
		var parent = $(this).closest('code').text()
			.replace($(this).text(), '')
			.replace($(this).closest('code').find('a').text(), '')
			.replace($(this).closest('code').find('.check').text(), '')

		var code = '\
                        (function(){\n\
                                ' + parent + ' \n\
                                try { \n\
                                        ' + user_code + ' \n\
                                        if(!(' + assert + ')){ fail(); } else { success(); }\n\
                                        \n\
                                } catch(e){\n\
                                        console.log(e);\n\
                                        fail(e.message); \n\
                                }\n\
                        })()';
		$("<script" + " />").html(code).appendTo('.wrapper');
		//$(".wrapper").append('<script>' + code + '</s' + 'cript>');
	})

	$(".wrapper").on('paste', ".test input[type=text]", function(e) {
		active_butt = $(this).closest('.test');
		fail('Копіпаста заборонена!');
		return false;
	});
})
