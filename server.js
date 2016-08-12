var io = require('socket.io')('8888')
var mongoose = require('mongoose');
// var Gpio = require('onoff').Gpio
mongoose.connect('mongodb://localhost/alfathapp');
var Stats = mongoose.Schema({
	pin: String,
	status: String

});

var taskList = mongoose.Schema({
	pin: String,
	ontime: String,
	offtime: String,
	activity: String,
	description: String
})

var pinStatus = mongoose.model('pinStatus', Stats)
var listTask = mongoose.model('listTask', taskList)
io.on('connection', function(socket) {
	pinStatus.find({}).exec(function(err, data) {
		io.emit('statusAllButton', data)
	})

	socket.on('listTask', function(data) {
		if (typeof data === 'undefined') {
			listTask.find({}).sort('-_id').exec(function(err, datas) {
				io.emit('tasklisting', datas)
			})
		} else {
			if (typeof data.remove !== 'undefined') {
				deleteTask(data.id)
				console.log(data)
				io.emit('tasklisting', {
					'removed': data.id
				})
			}
			if (typeof data.pin !== 'undefined') {
				saveList = new listTask(data)
				saveList.save(function(e) {
					if (e) {
						console.log('err')
					} else {
						console.log('saved task')
					}
				})
				io.emit('tasklisting', saveList)
			}
		}
	})

	socket.on('onoff', function(data) {
		type = data.type
		pinId = data.pin
		if (data.type == 'on') {
			var savePin = new pinStatus({
				pin: pinId,
				status: type
			})
			savePin.save(function(err) {
				if (err) {
					console.log(err)
				} else {
					console.log('Start')
					// new Gpio(pinId,'out')
				}
			})
		}

		if (data.type == 'off') {
			pinStatus.remove({
				pin: pinId
			}, function(err) {
				if (err) {
					return handleError(err);
				} else {
					console.log('removed')
					// new Gpio(pinId,'out').unexport()
				}
			});
		}
		io.emit('statusButton', {
			pin: pinId,
			status: type
		})
	})
})

var deleteTask = function(id){
	listTask.remove({
		_id: id
	}, function(err) {
		if (err) {
			return handleError(err);
		} else {
			console.log('List removed')
		}
	});
}

setInterval(function() {
	listTask.find({}).sort('-_id').exec(function(err, datas) {
		var ontime = []
		var offtime = []
		var pinout = []
		var activity = []
		var id = []
		for (var i = 0; i < datas.length; i++) {
			ontime[i] = datas[i].ontime
			offtime[i] = datas[i].offtime
			pinout[i] = datas[i].pin
			activity[i] = datas[i].activity
			id[i] = datas[i]._id
		}
		d = new Date();
		H = (String(d.getHours()).length < 2) ? '0'+String(d.getHours()) : d.getHours()
		M = (String(d.getMinutes()).length < 2) ? '0'+String(d.getMinutes()) : d.getMinutes()
		S = d.getSeconds()
		jam = H+':'+M
		for (var i = 0; i < ontime.length; i++) {
			if (jam === ontime[i]) {
				if (S == '0') {
					console.log('on cuy',pinout[i], ontime[i])
					if(pinout[i] == '16'){
						console.log('Switch on..and starter...')
						// new Gpio(pinout[i],'out')
						// new Gpio('12','out')
						setTimeout(function(){
							// new Gpio('12','out').unexport()
							console.log('starter off')
						}, 1800)
					}
				}
			}
			if (jam === offtime[i]) {
				if (S == '0') {
					console.log('off time cuy', offtime[i])
					if(activity[i] == 'once'){
						console.log('off and delete on pin and id',pinout[i],id[i])
						deleteTask(id[i])
						io.emit('tasklisting', {
							'removed': id[i]
						})
					}
					// new Gpio(pinout[i],'out').unexport()

				}
			}
		}
	})
}, 1000)
