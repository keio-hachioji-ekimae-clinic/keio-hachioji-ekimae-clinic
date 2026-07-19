/**
 * 京王八王子駅前診療所 - お知らせ更新用 Google Apps Script
 *
 * 【事前準備（スクリプトのプロパティに設定）】
 * ファイル > プロジェクトの設定 > スクリプト プロパティ で以下を登録してください。
 *   GITHUB_TOKEN    : GitHubのPersonal Access Token（repo権限）
 *   GITHUB_OWNER    : GitHub Organization名（例: keio-hachioji-ekimae-clinic）
 *   GITHUB_REPO     : リポジトリ名（例: keio-hachioji-ekimae-clinic）
 *   GITHUB_BRANCH   : 対象ブランチ（例: main）
 *   FILE_PATH       : 更新対象ファイルのパス（例: data/notices.json）
 *   ADMIN_PASSWORD  : 管理ページのログインパスワード
 */

function doPost(e) {
  var result;
  try {
    var props = PropertiesService.getScriptProperties();
    var payload = JSON.parse(e.postData.contents);

    // パスワード確認
    if (payload.password !== props.getProperty('ADMIN_PASSWORD')) {
      return jsonResponse({ success: false, error: 'invalid_password' });
    }

    var current = getCurrentNotices(props);
    var notices = current.notices;
    var sha = current.sha;

    if (payload.action === 'create') {
      notices.push({
        id: 'notice_' + new Date().getTime(),
        date: payload.date,
        title: payload.title,
        body: payload.body,
        urgent: !!payload.urgent
      });
    } else if (payload.action === 'update') {
      var idx = findIndexById(notices, payload.id);
      if (idx === -1) return jsonResponse({ success: false, error: 'not_found' });
      notices[idx] = {
        id: payload.id,
        date: payload.date,
        title: payload.title,
        body: payload.body,
        urgent: !!payload.urgent
      };
    } else if (payload.action === 'delete') {
      var idx2 = findIndexById(notices, payload.id);
      if (idx2 === -1) return jsonResponse({ success: false, error: 'not_found' });
      notices.splice(idx2, 1);
    } else {
      return jsonResponse({ success: false, error: 'invalid_action' });
    }

    updateGithubFile(props, notices, sha);
    result = { success: true, notices: notices };

  } catch (err) {
    result = { success: false, error: String(err) };
  }
  return jsonResponse(result);
}

function doGet(e) {
  return ContentService.createTextOutput('OK: このURLはPOST専用のAPIです。');
}

function findIndexById(notices, id) {
  for (var i = 0; i < notices.length; i++) {
    if (notices[i].id === id) return i;
  }
  return -1;
}

function getCurrentNotices(props) {
  var url = buildContentsUrl(props);
  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'token ' + props.getProperty('GITHUB_TOKEN') },
    muteHttpExceptions: true
  });
  var data = JSON.parse(res.getContentText());
  var decoded = Utilities.newBlob(Utilities.base64Decode(data.content)).getDataAsString('UTF-8');
  return { notices: JSON.parse(decoded), sha: data.sha };
}

function updateGithubFile(props, notices, sha) {
  var url = buildContentsUrl(props);
  var newContent = JSON.stringify(notices, null, 2);
  var encoded = Utilities.base64Encode(newContent, Utilities.Charset.UTF_8);

  var body = {
    message: 'お知らせ更新（管理ページより自動反映）',
    content: encoded,
    sha: sha,
    branch: props.getProperty('GITHUB_BRANCH')
  };

  var res = UrlFetchApp.fetch(url, {
    method: 'put',
    contentType: 'application/json',
    headers: { Authorization: 'token ' + props.getProperty('GITHUB_TOKEN') },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() >= 300) {
    throw new Error('GitHub更新に失敗しました: ' + res.getContentText());
  }
}

function buildContentsUrl(props) {
  return 'https://api.github.com/repos/' + props.getProperty('GITHUB_OWNER') + '/' +
    props.getProperty('GITHUB_REPO') + '/contents/' + props.getProperty('FILE_PATH') +
    '?ref=' + props.getProperty('GITHUB_BRANCH');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
