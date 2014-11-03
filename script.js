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

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

var codes = [];
var ra = [];
var active_butt = false;

var fail = function(txt){
        active_butt.find('.check').remove();
        $("<div />").addClass('check').addClass('error').text((txt || 'Невірно')).css('opacity', 0).appendTo(active_butt).animate({opacity: 1}, 500);
        //active_butt.append('<div class="check error">Невірно</div>').delay(3000)//.find('.check-error').hide();
}
var normal = function(txt){
        active_butt.find('.check').remove();
        if(txt) txt = txt
                .replace(/\&lt;/g, '<')
                .replace(/\&gt;/g, '>')
                .replace(/\&quot\;/g, '"')
                .replace(/\&#039\;/g, "'");
        $("<div />").addClass('check').addClass('normal').text((txt || 'Це дуже просто!')).css('opacity', 0).appendTo(active_butt).animate({opacity: 1}, 500);
        //active_butt.append('<div class="check error">Невірно</div>').delay(3000)//.find('.check-error').hide();
}
var success = function(){
        active_butt.find('.check').remove();
        $("<div />").addClass('check').addClass('success').text('Правильно!').css('opacity', 0).appendTo(active_butt).animate({opacity: 1}, 500);
}

var process_text = function(str){

        var regs = [
                ['\#\#\#([^\n^\r]*)', '<h1>$1</h1>'],
                ['\#\#([^\n^\r]*)', '<h2>$1</h2>'],
                ['\n(\t*)\n(\t*)\n(\t*)\n', '<hr />'],
                ['\\|([^\s^\|]{1,})\\|', '<b>$1</b>'],
                ['@@@([^@]*)@@@', '<div class="block"><p>$1</p></div>'],
                ['\\^([^\^]*)\\^([^\^]*)\\^', '<div><div class="bad"><pre><code class="js">$1</code></pre></div> <div class="good"><pre><code class="js">$2</code></pre></div><div style="clear:both;"></div></div>'],
                ['```(?:[\n]*)?([^`]*)(?:[\n]*)?```', function(match, m1){ return '<pre><code class="js">' + escapeHtml(m1) + '</code></pre>'}],
                ['\n\n\n', '</p><p>'],
                ['\n\n', '<br><br>'],
                ['\\?\\?\\?(m)?\\%([^\%]*)\\%(([^\%^\n]*)\%)?', function(xxx, multiline, m1, m2, right_answer){
                                console.log('m1', arguments);
                                codes.push(m1);
                                ra.push(right_answer);
                                var ind = codes.length - 1;
                                return '<div class="test"><input type="text" placeholder="Введіть свій код сюди..." /><button type="check" data-i="' + ind + '">перевірити!</button><div style="clear:both;text-align:center"><a class="surrender" data-i="' + ind + '">Здаюсь, покажіть правильну відповідь</a></div></div>';
                        }],
        ]

        for(var i in regs){
                var r = new RegExp(regs[i][0], 'g');
                str = str.replace(r, regs[i][1]);
        }


        return str;
}



$.get('text.txt', function(txt){
        $(".wrapper").html(process_text(txt));
        $('code').each(function(i, block) {
                hljs.highlightBlock(block);
        });

        var toc = [];
        $(".wrapper h2").each(function(){
                toc.push($(this).html());
        })

        for(var i = 1; i < toc.length; i++){
                $("#zmist").append('<li>' + toc[i] + '</li>');
        }

        $("#zmist").append('<li> ...далі буде</li>');

        $(".wrapper").on('click', 'a.surrender', function(){
                var ind = $(this).attr('data-i');
                active_butt = $(this).closest('.test');
                normal(ra[ind]);

        })

        $(".wrapper").on('click', 'button[type=check]', function(){
                active_butt = $(this).parent();
                var ind = $(this).attr('data-i');
                var assert = codes[ind]
                        .replace(/\&quot\;/g, '"')
                        .replace(/\&#039\;/g, "'")
                        .replace(/\&lt;/g, '<')
                        .replace(/\&gt;/g, '>');
                var user_code = $(this).prev().val();
                var parent = $(this).closest('code').text()
                        .replace($(this).text(), '')
                        .replace($(this).closest('code').find('a').text(), '')
                        .replace($(this).closest('code').find('.check').text(), '')

                var code = '\
                        (function(){\n\
                                ' +parent + ' \n\
                                try { \n\
                                        ' + user_code + ' \n\
                                        if(!(' + assert + ')){ fail(); } else { success(); }\n\
                                        \n\
                                } catch(e){\n\
                                        console.log(e);\n\
                                        fail(); \n\
                                }\n\
                        })()';
                $("<script" + " />").html(code).appendTo('.wrapper');
                //$(".wrapper").append('<script>' + code + '</s' + 'cript>');
        })

        $(".wrapper").on('paste', ".test input[type=text]", function(e){
                active_butt = $(this).closest('.test');
                fail('Копіпаста заборонена!'); 
                return false;
        });
})
