<?php

function debug($a){
	echo'<pre>';
	print_r($a);
	echo'</pre>'; die();
}

function parse_tasks(){
        global $tasks;
	$res = array();
	$tasks = file_get_contents("./chapters/tasks.txt");
	$tasks = preg_split("/\={3,}/", $tasks);
	foreach($tasks AS $key => $val){
		if(!$val) {
			unset($tasks[$key]); 
			continue;
		}
		preg_match("/^\s(\d*)/", $val, $r);
		if(!$r[1]) continue;
		$parts = preg_split("/\-{3,}/", $val);
		$res[] = array(
		    'num' => trim($r[1]),
		    'pre' => trim(preg_replace("/^\s(\d*)/", "", $parts[0], 1)),
		    'text' => trim($parts[1]),
		    'cond' => trim($parts[2]),
		    'answer' => trim($parts[3])
		);
	}
        //debug($res);
        if(!file_put_contents("./tasks.json", json_encode($res))){
            die('JSON failed');
        };
        return $res;
}

function return_task_html($num){
    global $tasks;
    foreach($tasks AS $task){
        if($task['num'] === $num) break;
    }
    $str = '<div class="task" data-id="'.$task['num'].'"><h5>Завдання №'.$task['num'].'</h5>'
            . '<div class="pre"><pre><code class="hljs js">'.$task['pre'].'</code></pre></div>'
            . '<div class="txt">'.$task['text'].'</div>'
            . '<div class="ans"><textarea></textarea><button>Перевірити!</button></div>'
            . '</div>';
    return $str;
}

function process($txt){
	$txt = preg_replace('/\#\#\#([^\n^\r]*)/', '<h1>$1</h1>', $txt);
	$txt = preg_replace('/\#\#([^\n^\r]*)/', '<h2>$1</h2>', $txt);
	$txt = preg_replace('/\#([^\n^\r]*)/', '<h3>$1</h3>', $txt);
	$txt = preg_replace('/\n(\t*)\n(\t*)\n(\t*)\n/', '<hr />', $txt);
	$txt = preg_replace('/\\|([^\s^\|]{1,})\\|/', '<b>$1</b>', $txt);
	$txt = preg_replace_callback(
        '/\\^([^\^]*)\\^([^\^]*)\\^/',
        create_function(
            '$m',
            'if(isset($m[0])){'
		. '$r = \''
		. '<div><div class="bad">'
		. '<pre>'
		. '<code class="">\' . trim(htmlspecialchars($m[1])) . \'</code>'
		. '</pre>'
		. '</div> '
		. '<div class="good"><pre><code class="">\' . trim(htmlspecialchars($m[2])) . \'</code>'
		. '</pre></div><div style="clear:both;"></div></div>\';'
		. '$r = preg_replace("/\n\r\n/", "\n", $r);'
		. 'return $r;'
		. '}'
        ), $txt);
	$txt = preg_replace_callback(
		'/```(?:[\n]*)?([^`]*)(?:[\n]*)?```(\\?)?/', 
		create_function(
			'$m', 
			'$str = \'<pre><code class="">\' . trim(htmlspecialchars($m[1])) . \'</code></pre>\';
			 if(isset($m[2])){// show the result
				$str += \'<h4>Результат:</h4><div class="result example">\' . $m[1] . \'</div>\';
			}
			$str = preg_replace("/\n\r\n/", "\n", $str);
			return $str;'
		), $txt);
	$txt = preg_replace_callback(
		'/@@@((\d|\,)*)/', 
		create_function(
			'$m', 
			'$nums = split(",", $m[1]); $res = ""; foreach($nums AS $num){ $res .= return_task_html($num);} return $res;'
		), $txt);
	$txt = preg_replace('/\n\r\n/', '<br><br>', $txt);
	return $txt;
}

$dirs = scandir("./chapters");
$chapters = array();
foreach($dirs AS $file){
	preg_match("/^(\d+)\_.*/i", $file, $res);
	if(isset($res[0])){
		$chapters[$res[1]] = $res[0];
	}
}
ksort($chapters);

$min_index = min(array_keys($chapters));
$max_index = max(array_keys($chapters));

$chapter = isset($_GET['chapter']) ? (int) $_GET['chapter'] : 1;

$tasks = parse_tasks();

$text = file_get_contents('./chapters/'.$chapters[$chapter]);

?><!DOCTYPE html>
<html>
	<head>
		<title>Вивчи Javascript - заради добра, заради України!</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width">
		<script src="jquery.js"></script>
		<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/styles/default.min.css">
		<link rel="stylesheet" href="mik.css">
		<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/highlight.min.js"></script>
		<script src="assert.js"></script>
                <script src="../firera/firera.neo.js"></script>
	</head>
	<body>
		<div class="wrapper">
			<h1> Вивчи Javascript - заради добра, заради України!</h1><br/>
			<div class="block">
				<?php echo process($text, $tasks) ?>
				<nav>
					<div class="l50">
						<?php if($chapter !== $min_index){?>
						<a href="./index.php?chapter=<?php echo $chapter - 1;?>">
							Назад
						</a>
						<?php } ?>
					</div>
					<div class="r50">
						<?php if($chapter !== $max_index){?>
						<a href="./index.php?chapter=<?php echo $chapter + 1;?>">
							Далі
						</a>
						<?php } ?>
					</div>
					<div style="clear:both"></div>
				</nav>
			</div>
		</div>
	</body>
	<script>
	$('code').each(function(i, block) {
		hljs.highlightBlock(block);
	});
        $.getJSON("./tasks.json", function(data){
            //console.log('got', data);
        })
        
        var app = new Firera();
        app('tasks').$('.task').then(function(els){
            for(var i in els){
                els[i] = {
                    '$rootNode': els[i]
                }
            }
            return els;
        });
        app('ts').are({
            takes: ['$datasource'],
            each: {
                id: ['is', '|attr(data-id)']
            }
        }, {gives_takes_params: ['tasks']})
        app.applyTo('.wrapper');
        console.log(app.get('ts'));
        console.log(Firera.dump(app('ts')));
	</script>
</html><?php

//debug($chapters);
