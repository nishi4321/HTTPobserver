# HTTP observer

対象のURLに対して定期的にHTTPリクエストを投げ、その応答を監視するソフトウェア。  
簡易的なWebサービスの死活監視が目的。

# configuration
`config.json` をルートディレクトリに作成してください。  
設定項目については、同梱されている `config_sample.json` を参照してください。

`try_count` で設定した回数以上、200以外のステータスコードが返ってきた場合に通知を行います。  
`0` を設定することで即座に通知を行えます。

# preparation
install required packages.
```
$ npm i
```

run app.
```
$ npm start
```

# LICENSE
MIT License