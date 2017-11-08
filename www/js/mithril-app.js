var PollDisplay = {
	view: function(ctrl, args) {
		var poll = args.poll();

		return m('div.panel panel-default', [
			m('div.panel-heading', m('h1.panel-title text-center', poll ? 'Voting on: ' + poll.name : 'No active vote'),),
			m('div.panel-body text-center', [ 
				m('img', {src: poll ? poll.imageUrl : 'http://i.imgur.com/Kzk9I8o.png'})
			]),
			m('h4', poll ? poll.desc : ''),
			m('div.panel-footer text-center', [
				m('button.btn-success btn-lg', {id: 'yes', onclick: args.controller.vote}, ['YES ', m('span.glyphicon glyphicon-thumbs-up')]),
				m('button.btn-danger btn-lg', {id: 'no', onclick: args.controller.vote}, ['NO ', m('span.glyphicon glyphicon-thumbs-down')])
			])
		]);
	}
}

var UserDisplay = {
	view: function(ctrl, args) {
		var optional = _.size(args.users()) <= 2 ? ' (Need at least 3)' : '';

		return m('div.panel panel-default', [
				m('div.panel-heading', m('h1.panel-title text-center', 'Users' + optional)),
				m('div.panel-body', [
					m('ul.list-group', getUsers(args.users()))
				])
			]);

		function getUsers(users) {
			return _.map(users, function(user) {
				var voteClass = (user.vote == 'yes') ? 'list-group-item-success' : '';
				voteClass = (user.vote == 'no') ? 'list-group-item-danger' : voteClass;

				return m('li.list-group-item', {class: [voteClass]},user.name ? user.name : user.id);
			});
		}
	}
};

var ChatDisplay = {	
	view: function(ctrl, args) {
		return m('div.panel panel-default', [
			m('div.panel-body', {id: 'chat-content', config: configChat}, getContent(args.controller.chatState())),
			m('div.panel-footer', [
				m('form.input-group', {onsubmit(event) {
					event.preventDefault();
					args.controller.sendMessage();
				}}, [
					m('input.form-control', {
						value: args.controller.typedMessage(),
						oninput: m.withAttr("value", args.controller.typedMessage),
					}),
					m('span.input-group-btn', m('button[type=submit].btn btn-default', 'Send'))
					])
				])
		]);

		function configChat(elem) {
			elem.scrollTop = elem.scrollHeight - elem.clientHeight;
		}

		function keyDown(text, a) {
			if(evt.keyCode == 13) {
				args.controller.sendMessage();
			} else {
				args.controller.typedMessage(evt.currentTarget.textContent);
				m.redraw.strategy("none") 
			}
		}

		function getContent(chatState) {
			return _.map(chatState, function(chatLine) {
				return m('div', [
					m('span.bold', chatLine.sender),
					m('span', ':  '),
					m('span', {class: chatLine.special ? ['bold'] : ''}, chatLine.content)
				])
			});
		}
	}
};

var MainPage = {
	controller: function(args) {
		var socket = io();

		var name = window.location.search.substr(1).split('=')[1]
		if(!name) name = window.sessionStorage.getItem('tinderMultiplayerUserName');
		if(!name)	name = window.prompt("Do you have a name?","");

		if(name){
			socket.emit('updateName', name);
			window.sessionStorage.setItem('tinderMultiplayerUserName', name);
		}

		var ctrl = this;
		ctrl.currentPoll = m.prop({});
		ctrl.users = m.prop({});
		ctrl.chatState = m.prop([]);

		ctrl.typedMessage = m.prop('');
		ctrl.sendMessage = function() {
			socket.emit('sendMessage', ctrl.typedMessage());
			ctrl.typedMessage('');
		}

		ctrl.vote = function(button) {
			socket.emit('castVote', button.currentTarget.id);
		}

    socket.on('updatePoll', function(currentPoll){
    	m.startComputation();
	    ctrl.currentPoll(currentPoll);
	    m.endComputation();
	  });

	  socket.on('updateUsers', function(users){
    	m.startComputation();
    	ctrl.users(users);
      m.endComputation();
	  });

	  socket.on('updateChat', function(chatState){
  		m.startComputation();
    	ctrl.chatState(chatState);
      m.endComputation();
	  });
	},

	view: function(ctrl, args) {
		return m('div.container', [
			m('div.row', [ 
				m('div.col-md-8', m.component(PollDisplay, {controller: ctrl, poll: ctrl.currentPoll})),
				m('div.col-md-4', m.component(UserDisplay, {users: ctrl.users}))
			]),
			m('div.row', [ 
				m('div.col-md-12', m.component(ChatDisplay, {controller: ctrl} ))
			])
		]);
	}
}

m.mount(document.getElementById('main'), MainPage);