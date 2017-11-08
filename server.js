var express = require('express'),
    app = express(),
    path = require('path'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    bodyParser = require('body-parser'),
    shortid = require('shortid'),
    _ = require('lodash');

app.use(express.static(path.join(__dirname, './www')));
app.set('port', (process.env.PORT || 3000));
app.use( bodyParser.json() );  

var MIN_VOTES = 2;
var MAX_CHAT_LENGTH = 100;

var users = {};
var chatState = [];
var currentPoll;

class Poll {
	constructor(name, imageUrl) {
		this.name = name;
		this.imageUrl = imageUrl;
		this.decision = 'openProfile';
		this.desc = '';
	}
}

class User {
  constructor(id) {
    this.id = id;
    this.name = '';
    this.vote = '';
  }
}

class Message {
	constructor(sender, content) {
		this.sender = sender;
		this.content = content;
		this.special = '';
	}
}


app.post('/controllerCallHome', function(req, res) {
  var data = req.body;

  //initial setup of new person, inits a new Poll
	if(data.name && data.imageUrl) {
		currentPoll = new Poll(data.name, data.imageUrl);
		console.log('new poll: ' + data.name);
	}

	if(currentPoll && data.desc) {
		currentPoll.desc = data.desc;
	}

	if(currentPoll) {
		res.send(currentPoll.decision);
	} else {
		res.end();
	}

	io.emit('updatePoll', currentPoll);
});

io.on('connection', function(socket){
	socket.id = shortid.generate();
	users[socket.id] = new User(socket.id);
	updateAll();

  socket.on('disconnect', function(){
  	delete users[socket.id]
  });

  socket.on('updateName', function(name) {
  	users[socket.id].name = name;
  	io.emit('updateUsers', users);
  });

  socket.on('castVote', function(vote) {
  	users[socket.id].vote = vote;
		io.emit('updateUsers', users);

		var votes = {yes: 0, no: 0};
		var userCount = _.size(users);
		_.map(users, function(user) {
			votes[user.vote]++;
		});

		var voteCount = votes['yes'] + votes['no'] 
		if(voteCount > MIN_VOTES && voteCount >= userCount) {
			//A decision has been made!
			if(votes['yes'] > votes['no']) {
				currentPoll.decision = 'like';
			} else if (votes['yes'] < votes['no']) {
				currentPoll.decision = 'dislike';
			}
			postDecisionChat();
			clearVotes();
	}
  });

  socket.on('sendMessage', function(message) {
    chatState.push(new Message( users[socket.id].name ? users[socket.id].name : users[socket.id].id, message ));

    if(chatState.length > MAX_CHAT_LENGTH) {
    	chatState = _.takeRight(chatState, MAX_CHAT_LENGTH);
    }

    io.emit('updateChat', chatState);
  });
});

function clearVotes() {
	_.map(users, function(user) {
		user.vote = '';
	});
	io.emit('updateUsers', users);
}

function postDecisionChat() {
	var message = currentPoll.name + ' got the ' + currentPoll.decision;
	var message = new Message( 'Server', message);
	message.special = true;
	chatState.push(message);
	io.emit('updateChat', chatState);
}

function updateAll() {
	io.emit('updateUsers', users);
	io.emit('updatePoll', currentPoll);
	io.emit('updateChat', chatState);
}

http.listen(app.get('port'), function () {
    console.log('listening on: ' + app.get('port'));
});