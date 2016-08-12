var db = openDatabase('mydb', '1.0', 'db ip address', 2 * 1024 * 1024);

function localstg(val) {
	db.transaction(function(tx) {
		tx.executeSql('DROP TABLE IF EXISTS ipaddress', [], function() {})
		tx.executeSql('CREATE TABLE IF NOT EXISTS ipaddress (id INTEGER PRIMARY KEY, ipaddres,port)');
		// console.log(val[0] ==)
		if (val.length > 0) {
			tx.executeSql('INSERT INTO ipaddress (ipaddres,port) VALUES (?, ?)', [(val[0] === 1) ? '127.0.0.1' : val[0], val[1]]);
		}
		window.location.reload(true);
	});
}

$('.savesetting').click(function() {
	ins = $(this).parent().find('input')
	ip = []
	for (var i = 0; i < ins.length; i++) {
		if (ins[i].value !== '') {
			ip[i] = ins[i].value
		}
	}
	localstg(ip)
})
db.transaction(function(tx) {
	tx.executeSql('SELECT * FROM ipaddress', [], function(tx, results) {
		ips = results.rows[0].ipaddres
		ports = results.rows[0].port
		var socket = io.connect('http://' + ips + ':' + ports + '/');
		var c = 0

		$(function() {
			var checkbox = $('input[type=checkbox]')
			var switchOnToStart = false;
			$(checkbox).click(function(){
				checked = $(this).prop('checked')
				// console.log(checked)
				pin = $(this).attr('class').substr(3,$(this).attr('class').length -1)
				if(checked === true){
					type = 'on'
					c = 0
				} else {
					type = 'off'
				}
				turn('',type,pin)
			})

			$('img').bind('touchstart touchend click', function(e) {
				src = $(this).attr('src')
				lamp = $(this).attr('class').substr(1, $(this).attr('class').length - 1)
				if (src == 'img/power-off.png' && e.type == 'touchstart') {
					c += 1
					type = 'on'
				} else {
					type = 'off'
				}
				switchOnToStart = $('input[class=acb16]:checked').prop('checked')
				if(switchOnToStart == true){
					if(c > 1){
						alert('Matikan switch dulu !!')
					} else {
						if (typeof type !== 'undefined') {
							turn('', type, lamp)
						}
					}
				} else {
					alert('Nyalakan switch dulu !!')
					console.log('Reject !!')
				}
			})

			$('.act').click(function(e) {
				dataList = {
					pin: $('[name=pin]').val(),
					ontime: $('[name=on]').val(),
					offtime: $('[name=off]').val(),
					activity: $('input[name=activity]:checked', '#myform').val(),
					description: $('[name=description]').val()
				}
				socket.emit('listTask', dataList)
				$('form')[0].reset();
				$('#modalMaterial').modal('hide');
			})

		})

		socket.on('statusAllButton', turn);

		socket.emit('listTask')
		socket.on('tasklisting', function(data) {
			if (data.length > 0) {
				$('.datas2').remove()
				for (var i = 0; i < data.length; i++) {
					everyday = (data[i].activity == 'once') ? 'repeat' : 'refresh'
					$('tbody').append('<tr class="datas2 ' + data[i]._id + '" data-val=""><td><i class="glyphicon glyphicon-' + everyday + '"></i></td><td>' + data[i].description + '</td><td>' + data[i].ontime + '</td><td>' + data[i].offtime + '</td><td><i class="glyphicon glyphicon-remove" data-val="' + data[i]._id + '"></i></td></tr>')
				}
			}
			if (typeof data._id !== 'undefined') {
				$('tbody:first').append($('<tr class="datas2 ' + data._id + '" ><td></td><td>' + data.description + '</td><td>' + data.ontime + '</td><td>' + data.offtime + '</td><td><i class="glyphicon glyphicon-remove" data-val="' + data._id + '" ></i></td></tr>').first())

			}
			if (typeof data.removed !== 'undefined') {
				$('.' + data.removed).remove()
			}
			$('i.glyphicon-remove').click(function() {
				idVal = $(this).attr('data-val')
				removeList(idVal)
			})

			function removeList(id){
				socket.emit('listTask', {
					'remove': true,
					id: id
				})
			}
		})

		socket.on('statusButton', function(data) {
				// console.log(data.status)
			if (data.status == 'on') {
				$('.a' + data.pin).attr('src', 'img/power-on.png')
				$('.acb' + data.pin).prop('checked',true)

			} else {
				$('.a' + data.pin).attr('src', 'img/power-off.png')
				$('.acb' + data.pin).attr('checked', false)
			}
		})
		function turn(server, type, lamp) {
			if (server !== '') {
				btnImg = $('img')
				for (var i = 0; i < btnImg.length; i++) {
					img = $(btnImg)[i]
					for (var d = 0; d < server.length; d++) {
						if ($(img).attr('pin') === server[d].pin) {
							$('.a' + server[d].pin).attr('src', 'img/power-on.png')
						}
					}
				}

				var btnSwitch = $('[type=checkbox]')
				for (var x = 0; x < btnSwitch.length; x++) {
					swit = $(btnSwitch)[x]
					for (var z = 0; z < server.length; z++) {
						if($(swit).attr('pin') == server[z].pin){
							$('.acb' + server[z].pin).prop('checked',true)
						}
					}
				}
			}
			if (type && lamp) {
				opt = {
					type: type,
					pin: lamp
				}
				socket.emit('onoff', opt)
			}

		}
	});
})