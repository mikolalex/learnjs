<?php

function debug($a){
	echo'<pre>';
	print_r($a);
	echo'</pre>'; //die();
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

$text = file_get_contents('./chapters/'.$chapters[$chapter]);
?><!DOCTYPE html>
<html>
	<head>
		<title>Вивчи Javascript - заради добра, заради України!</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width">
		<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js"></script>
		<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/styles/default.min.css">
		<link rel="stylesheet" href="mik.css">
		<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/highlight.min.js"></script>
		<script src="assert.js"></script>
	</head>
	<body>
		<div class="wrapper">
			<h1> Вивчи Javascript - заради добра, заради України!</h1><br/>
			<div class="block">
				<?php echo process($text) ?>
				<nav>
					<div class="l50">
						<?php if($chapter !== $min_index){?>
						<a href="/<?php echo $chapter - 1;?>">
							Назад
						</a>
						<?php } ?>
					</div>
					<div class="r50">
						<?php if($chapter !== $max_index){?>
						<a href="/<?php echo $chapter + 1;?>">
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
	</script>
</html><?php

//debug($chapters);
