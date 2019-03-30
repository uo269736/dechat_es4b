const auth = require('solid-auth-client');
const fc = require('solid-file-client');
const namespaces = require('../lib/namespaces');
const { default: data } = require('@solid/query-ldflex');
const Core = require('../lib/core');
const DataSync = require('../lib/datasync');

const Personal = require('../lib/personal');

let refreshIntervalId;
let core = new Core(auth.fetch);
let personal = new Personal(core);
let dataSync= new DataSync(auth.fetch);


$('.login-btn').click(() => {
  auth.popupLogin({ popupUri: 'https://solid.github.io/solid-auth-client/dist/popup.html' });
});

$('#logout-btn').click(() => {
  auth.logout();
});

$('#refresh-btn').click(checkForNotifications);

$('#open-btn').click(() => {
  //USE IT FOR TESTING
});



auth.trackSession(async session => {
  const loggedIn = !!session;

  if (loggedIn) {
    $('#chat-options').addClass('hidden');
    $('#loading-gif').removeClass('hidden');

    personal.loadNames(session.webId).then(name => {
      personal.loadInbox();
      $('#user-name').text(name);
      $('#nav-login-btn').addClass('hidden');
    });

    personal.loadFriendList(session.webId).then(() => {
      $('#chat-options').removeClass('hidden');
      $('#loading-gif').addClass('hidden');
    });

    $('#user-menu').removeClass('hidden');
    $('#login-required').modal('hide');  

    await checkForNotifications();
    // refresh every 5 sec
    refreshIntervalId = setInterval(checkForNotifications, 5000);
  } else {
    $('#nav-login-btn').removeClass('hidden');
    $('#user-menu').addClass('hidden');
    $('#chat').addClass('hidden');
    $('#new-chat-options').addClass('hidden');
    $('#join-chat-options').addClass('hidden');
    $('#continue-chat-options').addClass('hidden');
    $('#chat-options').removeClass('hidden');
    $('#how-it-works').removeClass('hidden');
    personal.clearInfo();
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
  
});

/**
 * This method updates the UI after a chat option has been selected by the user.
 */
function afterChatOption() {
  $('#chat-options').addClass('hidden');
  $('#how-it-works').addClass('hidden');
}

$('#new-btn').click(async () => { 
  if (personal.username) {
    afterChatOption();
    
    $('#possible-people').empty();
    core.getChatGroups(personal).then(groupNames => {
      for(const chat of groupNames) {
        $('#possible-people').append('<option value='+chat.id+'>'+chat.name+'</option>');      
      }
    });
    for await (const friend of personal.friendList) {
        $('#possible-people').append('<option value='+friend.username+'>'+friend.username+'</option>');
    }
    
    $("#data-name").keydown(function (e) {
      if (e.keyCode == 13) {
        core.sendMessage(personal);
      }
    });
    $('#new-chat-options').removeClass('hidden');
  } else {
    $('#login-required').modal('show');
  }
});

$('#create-group').click(async () => { 
  if (personal.username) {
    afterChatOption();
    $('#check-people-group').empty();
    for await (const friend of personal.friendList) {
      $('#check-people-group').append('<input class="form-check-input" type="checkbox" id="'+friend.username+'"><label class="form-check-label" for="'+friend.username+'">'+friend.username+'</label><br>');
    }
    $('#create-new-group').removeClass('hidden');
  } else {
    $('#login-required').modal('show');
  }
});

$('#create-button').click(async () => { 
  var friendsGroup = new Array();
  for await (const friend of personal.friendList) {
    if($('#'+friend.username).prop('checked'))
      friendsGroup.push(friend);
  }
  $('#create-new-group').addClass('hidden');
  // CREAR EL GRUPO AQUI
  core.createGroup(personal, friendsGroup);
});

$('#start-new-chat-btn').click(async () => {
   await core.sendMessage(personal);
});



/**
 * This method checks if a new move has been made by the opponent.
 * The necessarily data is stored and the UI is updated.
 * @returns {Promise<void>}
 */
async function checkForNotifications() {
  var length = $('#mySelectList > option').length;
  if(length === 0)
    await core.loadMessages(personal);
}

$('#clear-inbox-btn').click(async () => {
  await personal.clearInbox(dataSync);
});


$('.btn-cancel').click(() => {
  $('#chat').addClass('hidden');
  $('#new-chat-options').addClass('hidden');
  $('#join-chat-options').addClass('hidden');
  $('#continue-chat-options').addClass('hidden');
  $('#chat-options').removeClass('hidden');
  $('#how-it-works').removeClass('hidden');
});

$("#cancel-group-menu").click(() => {
  $('#create-new-group').addClass('hidden');
});

$("#possible-people-btn").click( async () => core.loadMessages(personal));


