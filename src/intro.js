/* ---------- intro: landing page (what, why, how, trailer, demo), language step, guided tour ----------
   Every time the site opens: the landing page → "Enter the experience" → the language screen (skipped only when
   "Remember this language" was ticked; Me → Language changes it) → the app with a short tour (every time, skippable).
   A language change reloads the page; sessionStorage 'tr-resume' tells the reloaded page where to pick up. */
Object.assign(UI18N.te,{"Singer voice":"గాయకుడి గొంతు","AI voice":"AI గొంతు","Recitations now in the singer's voice":"ఇప్పుడు పఠనం గాయకుడి గొంతులో","Recitations now in the AI voice":"ఇప్పుడు పఠనం AI గొంతులో","Enter":"ప్రవేశించు","Enter the experience":"అనుభవంలోకి ప్రవేశించండి","Watch the trailer":"ట్రైలర్ చూడండి","What":"ఏమిటి","Why":"ఎందుకు","How":"ఎలా",
 "Dakṣiṇāmūrti Aṣṭakam · Ādi Śaṅkara":"దక్షిణామూర్తి అష్టకం · ఆది శంకర",
 "Eight verses. Eight truths about who you really are. Learn them the way you scroll.":"ఎనిమిది శ్లోకాలు. నువ్వు నిజంగా ఎవరో చెప్పే ఎనిమిది సత్యాలు. స్క్రోల్ చేస్తూనే నేర్చుకోండి.",
 "A reel for every verse":"ప్రతి శ్లోకానికి ఒక రీల్","Hey Tattva turns the Dakṣiṇāmūrti Aṣṭakam into short reels. Eight verses by Ādi Śaṅkara, each holding one tattva, a truth about the Self. Every verse comes with its meaning word by word, a 3D film, a song and games.":"హే తత్త్వ దక్షిణామూర్తి అష్టకాన్ని చిన్న రీల్స్‌గా మారుస్తుంది. ఆది శంకరుల ఎనిమిది శ్లోకాలు, ప్రతి దానిలో ఒక తత్త్వం, ఆత్మ గురించి ఒక సత్యం. ప్రతి శ్లోకానికి పదం పదంగా అర్థం, 3D చిత్రం, పాట, ఆటలు ఉన్నాయి.",
 "Old wisdom, easy to start":"ప్రాచీన జ్ఞానం, మొదలుపెట్టడం సులభం","These verses are more than a thousand years old and not easy to begin. A short reel is. Watching makes you curious, singing makes the words stay, playing makes the meaning yours.":"ఈ శ్లోకాలు వెయ్యి సంవత్సరాలకు పైగా పాతవి, మొదలుపెట్టడం కష్టం. ఒక చిన్న రీల్ సులభం. చూడటం ఆసక్తి కలిగిస్తుంది, పాడటం పదాలను గుర్తుంచుతుంది, ఆడటం అర్థాన్ని నీదిగా చేస్తుంది.",
 "Five simple steps":"ఐదు సులభమైన అడుగులు","Watch":"చూడండి","Understand":"అర్థం చేసుకోండి","Sing":"పాడండి","Play":"ఆడండి","Share":"షేర్ చేయండి",
 "Swipe through the reels, one tattva in each.":"రీల్స్‌ను స్వైప్ చేయండి, ప్రతి దానిలో ఒక తత్త్వం.","Open the meaning, word by word.":"అర్థాన్ని పదం పదంగా తెరవండి.","Sing the verse. Your pitch is scored live.":"శ్లోకం పాడండి. మీ స్వరానికి వెంటనే స్కోరు వస్తుంది.",
 "Four games for every tattva, alone or with friends.":"ప్రతి తత్త్వానికి నాలుగు ఆటలు, ఒంటరిగా లేదా స్నేహితులతో.","Light the diya when you learn one, and make your own reel.":"నేర్చుకున్నప్పుడు దీపం వెలిగించండి, మీ సొంత రీల్ చేయండి.",
 "The trailer":"ట్రైలర్","See it in action":"ఇది ఎలా పనిచేస్తుందో చూడండి","A real walk through the app on a phone.":"ఫోన్‌లో యాప్ నిజమైన పర్యటన.","The eight tattvas":"ఎనిమిది తత్త్వాలు","Ready?":"సిద్ధమా?",
 "Free. No sign-in needed to watch, sing and play.":"ఉచితం. చూడటానికి, పాడటానికి, ఆడటానికి సైన్ ఇన్ అవసరం లేదు.","Sound on":"సౌండ్ ఆన్","Sound off":"సౌండ్ ఆఫ్","Replay":"మళ్ళీ","Pause":"ఆపు","Play trailer":"ట్రైలర్ ప్లే",
 "One truth about the Self in every verse.":"ప్రతి శ్లోకంలో ఆత్మ గురించి ఒక సత్యం.","Each verse is a reel and a 3D film.":"ప్రతి శ్లోకం ఒక రీల్, ఒక 3D చిత్రం.","Four games for every tattva.":"ప్రతి తత్త్వానికి నాలుగు ఆటలు.","Your voice, scored live, note by note.":"మీ గొంతు, స్వరం స్వరంగా వెంటనే స్కోరు.","Watch. Understand. Sing. Play.":"చూడండి. అర్థం చేసుకోండి. పాడండి. ఆడండి.",
 "Remember this language":"ఈ భాషను గుర్తుంచుకో","Don’t ask again when I open the app.":"యాప్ తెరిచినప్పుడు మళ్ళీ అడగవద్దు.","You can change it any time in Me → Language.":"Me → భాషలో ఎప్పుడైనా మార్చవచ్చు.","Always use this language":"ఎప్పుడూ ఈ భాషనే వాడు","Ask me each time":"ప్రతిసారి అడుగు",
 "Quick tour":"చిన్న పర్యటన","Skip":"దాటవేయి","Next":"తర్వాత","Back":"వెనుకకు","Begin":"మొదలుపెట్టు","Welcome to Hey Tattva":"హే తత్త్వకు స్వాగతం","A 30-second tour of what each button does.":"ప్రతి బటన్ ఏమి చేస్తుందో 30 సెకన్ల పర్యటన.",
 "This is a reel. Swipe up for the next tattva, tap to pause.":"ఇది ఒక రీల్. తర్వాతి తత్త్వానికి పైకి స్వైప్ చేయండి, ఆపడానికి ట్యాప్ చేయండి.","Tap here to hear the verse and the music.":"శ్లోకం, సంగీతం వినడానికి ఇక్కడ ట్యాప్ చేయండి.","Light the diya when you have learnt this tattva.":"ఈ తత్త్వం నేర్చుకున్నాక దీపం వెలిగించండి.",
 "Open the meaning of the verse, word by word.":"శ్లోకం అర్థాన్ని పదం పదంగా తెరవండి.","Make your own reel of this verse: your music, your voice.":"ఈ శ్లోకంతో మీ సొంత రీల్: మీ సంగీతం, మీ గొంతు.","Send this reel to a friend.":"ఈ రీల్‌ను స్నేహితుడికి పంపండి.",
 "Play the tattvas: four games, alone or live with friends.":"తత్త్వాలను ఆడండి: నాలుగు ఆటలు, ఒంటరిగా లేదా స్నేహితులతో లైవ్.","Create a reel: pick a tattva, instruments and sing the shloka.":"రీల్ చేయండి: తత్త్వం, వాయిద్యాలు ఎంచుకుని శ్లోకం పాడండి.","Your page: tattvas learnt, your reels, scores, name and language.":"మీ పేజీ: నేర్చుకున్న తత్త్వాలు, మీ రీల్స్, స్కోర్లు, పేరు, భాష.",
 "That’s it. Start with the first tattva.":"అంతే. మొదటి తత్త్వంతో మొదలుపెట్టండి.","Made with devotion by Laksh":"లక్ష్ భక్తితో చేసినది","{i} of {n}":"{n}లో {i}"});
Object.assign(UI18N.kn,{"Singer voice":"ಗಾಯಕನ ಧ್ವನಿ","AI voice":"AI ಧ್ವನಿ","Recitations now in the singer's voice":"ಈಗ ಪಠಣ ಗಾಯಕನ ಧ್ವನಿಯಲ್ಲಿ","Recitations now in the AI voice":"ಈಗ ಪಠಣ AI ಧ್ವನಿಯಲ್ಲಿ","Enter":"ಪ್ರವೇಶಿಸಿ","Enter the experience":"ಅನುಭವಕ್ಕೆ ಪ್ರವೇಶಿಸಿ","Watch the trailer":"ಟ್ರೈಲರ್ ನೋಡಿ","What":"ಏನು","Why":"ಏಕೆ","How":"ಹೇಗೆ",
 "Dakṣiṇāmūrti Aṣṭakam · Ādi Śaṅkara":"ದಕ್ಷಿಣಾಮೂರ್ತಿ ಅಷ್ಟಕಂ · ಆದಿ ಶಂಕರ",
 "Eight verses. Eight truths about who you really are. Learn them the way you scroll.":"ಎಂಟು ಶ್ಲೋಕಗಳು. ನೀನು ನಿಜವಾಗಿ ಯಾರು ಎಂಬ ಎಂಟು ಸತ್ಯಗಳು. ಸ್ಕ್ರೋಲ್ ಮಾಡುತ್ತಲೇ ಕಲಿಯಿರಿ.",
 "A reel for every verse":"ಪ್ರತಿ ಶ್ಲೋಕಕ್ಕೆ ಒಂದು ರೀಲ್","Hey Tattva turns the Dakṣiṇāmūrti Aṣṭakam into short reels. Eight verses by Ādi Śaṅkara, each holding one tattva, a truth about the Self. Every verse comes with its meaning word by word, a 3D film, a song and games.":"ಹೇ ತತ್ತ್ವ ದಕ್ಷಿಣಾಮೂರ್ತಿ ಅಷ್ಟಕವನ್ನು ಚಿಕ್ಕ ರೀಲ್‌ಗಳಾಗಿ ಮಾಡುತ್ತದೆ. ಆದಿ ಶಂಕರರ ಎಂಟು ಶ್ಲೋಕಗಳು, ಪ್ರತಿಯೊಂದರಲ್ಲೂ ಒಂದು ತತ್ತ್ವ, ಆತ್ಮದ ಬಗ್ಗೆ ಒಂದು ಸತ್ಯ. ಪ್ರತಿ ಶ್ಲೋಕಕ್ಕೆ ಪದ ಪದವಾಗಿ ಅರ್ಥ, 3D ಚಿತ್ರ, ಹಾಡು ಮತ್ತು ಆಟಗಳಿವೆ.",
 "Old wisdom, easy to start":"ಪ್ರಾಚೀನ ಜ್ಞಾನ, ಆರಂಭಿಸಲು ಸುಲಭ","These verses are more than a thousand years old and not easy to begin. A short reel is. Watching makes you curious, singing makes the words stay, playing makes the meaning yours.":"ಈ ಶ್ಲೋಕಗಳು ಸಾವಿರ ವರ್ಷಕ್ಕಿಂತ ಹಳೆಯವು, ಆರಂಭಿಸುವುದು ಕಷ್ಟ. ಒಂದು ಚಿಕ್ಕ ರೀಲ್ ಸುಲಭ. ನೋಡುವುದು ಕುತೂಹಲ ಮೂಡಿಸುತ್ತದೆ, ಹಾಡುವುದು ಪದಗಳನ್ನು ನೆನಪಿನಲ್ಲಿಡುತ್ತದೆ, ಆಡುವುದು ಅರ್ಥವನ್ನು ನಿಮ್ಮದಾಗಿಸುತ್ತದೆ.",
 "Five simple steps":"ಐದು ಸುಲಭ ಹೆಜ್ಜೆಗಳು","Watch":"ನೋಡಿ","Understand":"ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ","Sing":"ಹಾಡಿ","Play":"ಆಡಿ","Share":"ಹಂಚಿಕೊಳ್ಳಿ",
 "Swipe through the reels, one tattva in each.":"ರೀಲ್‌ಗಳನ್ನು ಸ್ವೈಪ್ ಮಾಡಿ, ಪ್ರತಿಯೊಂದರಲ್ಲೂ ಒಂದು ತತ್ತ್ವ.","Open the meaning, word by word.":"ಅರ್ಥವನ್ನು ಪದ ಪದವಾಗಿ ತೆರೆಯಿರಿ.","Sing the verse. Your pitch is scored live.":"ಶ್ಲೋಕ ಹಾಡಿ. ನಿಮ್ಮ ಸ್ವರಕ್ಕೆ ತಕ್ಷಣ ಅಂಕ.",
 "Four games for every tattva, alone or with friends.":"ಪ್ರತಿ ತತ್ತ್ವಕ್ಕೆ ನಾಲ್ಕು ಆಟಗಳು, ಒಬ್ಬರೇ ಅಥವಾ ಸ್ನೇಹಿತರೊಂದಿಗೆ.","Light the diya when you learn one, and make your own reel.":"ಕಲಿತಾಗ ದೀಪ ಹಚ್ಚಿ, ನಿಮ್ಮದೇ ರೀಲ್ ಮಾಡಿ.",
 "The trailer":"ಟ್ರೈಲರ್","See it in action":"ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ನೋಡಿ","A real walk through the app on a phone.":"ಫೋನ್‌ನಲ್ಲಿ ಆ್ಯಪ್‌ನ ನಿಜವಾದ ಪ್ರವಾಸ.","The eight tattvas":"ಎಂಟು ತತ್ತ್ವಗಳು","Ready?":"ಸಿದ್ಧರೇ?",
 "Free. No sign-in needed to watch, sing and play.":"ಉಚಿತ. ನೋಡಲು, ಹಾಡಲು, ಆಡಲು ಸೈನ್ ಇನ್ ಬೇಕಿಲ್ಲ.","Sound on":"ಧ್ವನಿ ಆನ್","Sound off":"ಧ್ವನಿ ಆಫ್","Replay":"ಮತ್ತೆ","Pause":"ನಿಲ್ಲಿಸಿ","Play trailer":"ಟ್ರೈಲರ್ ಪ್ಲೇ",
 "One truth about the Self in every verse.":"ಪ್ರತಿ ಶ್ಲೋಕದಲ್ಲಿ ಆತ್ಮದ ಬಗ್ಗೆ ಒಂದು ಸತ್ಯ.","Each verse is a reel and a 3D film.":"ಪ್ರತಿ ಶ್ಲೋಕ ಒಂದು ರೀಲ್, ಒಂದು 3D ಚಿತ್ರ.","Four games for every tattva.":"ಪ್ರತಿ ತತ್ತ್ವಕ್ಕೆ ನಾಲ್ಕು ಆಟಗಳು.","Your voice, scored live, note by note.":"ನಿಮ್ಮ ಧ್ವನಿ, ಸ್ವರ ಸ್ವರಕ್ಕೂ ತಕ್ಷಣ ಅಂಕ.","Watch. Understand. Sing. Play.":"ನೋಡಿ. ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ. ಹಾಡಿ. ಆಡಿ.",
 "Remember this language":"ಈ ಭಾಷೆಯನ್ನು ನೆನಪಿಡಿ","Don’t ask again when I open the app.":"ಆ್ಯಪ್ ತೆರೆದಾಗ ಮತ್ತೆ ಕೇಳಬೇಡಿ.","You can change it any time in Me → Language.":"Me → ಭಾಷೆಯಲ್ಲಿ ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಿಸಬಹುದು.","Always use this language":"ಯಾವಾಗಲೂ ಈ ಭಾಷೆ","Ask me each time":"ಪ್ರತಿ ಬಾರಿ ಕೇಳಿ",
 "Quick tour":"ಚಿಕ್ಕ ಪ್ರವಾಸ","Skip":"ಬಿಟ್ಟುಬಿಡಿ","Next":"ಮುಂದೆ","Back":"ಹಿಂದೆ","Begin":"ಆರಂಭಿಸಿ","Welcome to Hey Tattva":"ಹೇ ತತ್ತ್ವಕ್ಕೆ ಸ್ವಾಗತ","A 30-second tour of what each button does.":"ಪ್ರತಿ ಬಟನ್ ಏನು ಮಾಡುತ್ತದೆ ಎಂಬ 30 ಸೆಕೆಂಡಿನ ಪ್ರವಾಸ.",
 "This is a reel. Swipe up for the next tattva, tap to pause.":"ಇದು ಒಂದು ರೀಲ್. ಮುಂದಿನ ತತ್ತ್ವಕ್ಕೆ ಮೇಲೆ ಸ್ವೈಪ್ ಮಾಡಿ, ನಿಲ್ಲಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ.","Tap here to hear the verse and the music.":"ಶ್ಲೋಕ ಮತ್ತು ಸಂಗೀತ ಕೇಳಲು ಇಲ್ಲಿ ಟ್ಯಾಪ್ ಮಾಡಿ.","Light the diya when you have learnt this tattva.":"ಈ ತತ್ತ್ವ ಕಲಿತ ಮೇಲೆ ದೀಪ ಹಚ್ಚಿ.",
 "Open the meaning of the verse, word by word.":"ಶ್ಲೋಕದ ಅರ್ಥವನ್ನು ಪದ ಪದವಾಗಿ ತೆರೆಯಿರಿ.","Make your own reel of this verse: your music, your voice.":"ಈ ಶ್ಲೋಕದ ನಿಮ್ಮದೇ ರೀಲ್: ನಿಮ್ಮ ಸಂಗೀತ, ನಿಮ್ಮ ಧ್ವನಿ.","Send this reel to a friend.":"ಈ ರೀಲ್ ಅನ್ನು ಸ್ನೇಹಿತರಿಗೆ ಕಳುಹಿಸಿ.",
 "Play the tattvas: four games, alone or live with friends.":"ತತ್ತ್ವಗಳನ್ನು ಆಡಿ: ನಾಲ್ಕು ಆಟಗಳು, ಒಬ್ಬರೇ ಅಥವಾ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಲೈವ್.","Create a reel: pick a tattva, instruments and sing the shloka.":"ರೀಲ್ ಮಾಡಿ: ತತ್ತ್ವ, ವಾದ್ಯಗಳನ್ನು ಆರಿಸಿ ಶ್ಲೋಕ ಹಾಡಿ.","Your page: tattvas learnt, your reels, scores, name and language.":"ನಿಮ್ಮ ಪುಟ: ಕಲಿತ ತತ್ತ್ವಗಳು, ನಿಮ್ಮ ರೀಲ್‌ಗಳು, ಅಂಕಗಳು, ಹೆಸರು, ಭಾಷೆ.",
 "That’s it. Start with the first tattva.":"ಅಷ್ಟೇ. ಮೊದಲ ತತ್ತ್ವದಿಂದ ಆರಂಭಿಸಿ.","Made with devotion by Laksh":"ಲಕ್ಷ್ ಭಕ್ತಿಯಿಂದ ಮಾಡಿದ್ದು","{i} of {n}":"{n}ರಲ್ಲಿ {i}"});
Object.assign(UI18N.hi,{"Singer voice":"गायक की आवाज़","AI voice":"AI आवाज़","Recitations now in the singer's voice":"अब पाठ गायक की आवाज़ में","Recitations now in the AI voice":"अब पाठ AI आवाज़ में","Enter":"प्रवेश","Enter the experience":"अनुभव में प्रवेश करें","Watch the trailer":"ट्रेलर देखें","What":"क्या","Why":"क्यों","How":"कैसे",
 "Dakṣiṇāmūrti Aṣṭakam · Ādi Śaṅkara":"दक्षिणामूर्ति अष्टकम् · आदि शंकर",
 "Eight verses. Eight truths about who you really are. Learn them the way you scroll.":"आठ श्लोक। आप वास्तव में कौन हैं, इसके आठ सत्य। स्क्रॉल करते-करते सीखें।",
 "A reel for every verse":"हर श्लोक के लिए एक रील","Hey Tattva turns the Dakṣiṇāmūrti Aṣṭakam into short reels. Eight verses by Ādi Śaṅkara, each holding one tattva, a truth about the Self. Every verse comes with its meaning word by word, a 3D film, a song and games.":"हे तत्त्व दक्षिणामूर्ति अष्टकम् को छोटी रीलों में बदलता है। आदि शंकर के आठ श्लोक, हर एक में एक तत्त्व, आत्मा के बारे में एक सत्य। हर श्लोक के साथ शब्द-दर-शब्द अर्थ, एक 3D फ़िल्म, एक गीत और खेल हैं।",
 "Old wisdom, easy to start":"प्राचीन ज्ञान, शुरू करना आसान","These verses are more than a thousand years old and not easy to begin. A short reel is. Watching makes you curious, singing makes the words stay, playing makes the meaning yours.":"ये श्लोक हज़ार साल से भी पुराने हैं और शुरू करना आसान नहीं। एक छोटी रील आसान है। देखना जिज्ञासा जगाता है, गाना शब्दों को याद रखता है, खेलना अर्थ को आपका बनाता है।",
 "Five simple steps":"पाँच आसान कदम","Watch":"देखें","Understand":"समझें","Sing":"गाएँ","Play":"खेलें","Share":"शेयर करें",
 "Swipe through the reels, one tattva in each.":"रीलें स्वाइप करें, हर एक में एक तत्त्व।","Open the meaning, word by word.":"अर्थ खोलें, शब्द-दर-शब्द।","Sing the verse. Your pitch is scored live.":"श्लोक गाएँ। आपके सुर को तुरंत अंक मिलते हैं।",
 "Four games for every tattva, alone or with friends.":"हर तत्त्व के लिए चार खेल, अकेले या दोस्तों के साथ।","Light the diya when you learn one, and make your own reel.":"सीखने पर दीया जलाएँ, और अपनी रील बनाएँ।",
 "The trailer":"ट्रेलर","See it in action":"इसे चलते हुए देखें","A real walk through the app on a phone.":"फ़ोन पर ऐप की असली सैर।","The eight tattvas":"आठ तत्त्व","Ready?":"तैयार?",
 "Free. No sign-in needed to watch, sing and play.":"मुफ़्त। देखने, गाने और खेलने के लिए साइन इन की ज़रूरत नहीं।","Sound on":"आवाज़ चालू","Sound off":"आवाज़ बंद","Replay":"फिर से","Pause":"रोकें","Play trailer":"ट्रेलर चलाएँ",
 "One truth about the Self in every verse.":"हर श्लोक में आत्मा के बारे में एक सत्य।","Each verse is a reel and a 3D film.":"हर श्लोक एक रील और एक 3D फ़िल्म है।","Four games for every tattva.":"हर तत्त्व के लिए चार खेल।","Your voice, scored live, note by note.":"आपकी आवाज़, सुर-दर-सुर तुरंत अंक।","Watch. Understand. Sing. Play.":"देखें। समझें। गाएँ। खेलें।",
 "Remember this language":"यह भाषा याद रखें","Don’t ask again when I open the app.":"ऐप खोलने पर फिर न पूछें।","You can change it any time in Me → Language.":"Me → भाषा में कभी भी बदल सकते हैं।","Always use this language":"हमेशा यही भाषा","Ask me each time":"हर बार पूछें",
 "Quick tour":"छोटा दौरा","Skip":"छोड़ें","Next":"आगे","Back":"पीछे","Begin":"शुरू करें","Welcome to Hey Tattva":"हे तत्त्व में स्वागत है","A 30-second tour of what each button does.":"हर बटन क्या करता है, इसका 30 सेकंड का दौरा।",
 "This is a reel. Swipe up for the next tattva, tap to pause.":"यह एक रील है। अगले तत्त्व के लिए ऊपर स्वाइप करें, रोकने के लिए टैप करें।","Tap here to hear the verse and the music.":"श्लोक और संगीत सुनने के लिए यहाँ टैप करें।","Light the diya when you have learnt this tattva.":"यह तत्त्व सीख लेने पर दीया जलाएँ।",
 "Open the meaning of the verse, word by word.":"श्लोक का अर्थ शब्द-दर-शब्द खोलें।","Make your own reel of this verse: your music, your voice.":"इस श्लोक की अपनी रील: आपका संगीत, आपकी आवाज़।","Send this reel to a friend.":"यह रील किसी दोस्त को भेजें।",
 "Play the tattvas: four games, alone or live with friends.":"तत्त्वों को खेलें: चार खेल, अकेले या दोस्तों के साथ लाइव।","Create a reel: pick a tattva, instruments and sing the shloka.":"रील बनाएँ: तत्त्व और वाद्य चुनें, श्लोक गाएँ।","Your page: tattvas learnt, your reels, scores, name and language.":"आपका पेज: सीखे तत्त्व, आपकी रीलें, अंक, नाम और भाषा।",
 "That’s it. Start with the first tattva.":"बस इतना ही। पहले तत्त्व से शुरू करें।","Made with devotion by Laksh":"लक्ष ने भक्ति से बनाया","{i} of {n}":"{n} में से {i}"});

const FLOW={keep:()=>!!LS.get('tr-lang-keep',false)&&!!LANG,setKeep:v=>LS.set('tr-lang-keep',!!v),on:false};
function startFlow(){let resume=null;try{resume=sessionStorage.getItem('tr-resume');sessionStorage.removeItem('tr-resume');}catch(e){}
 const deep=/^#(r-|join-|g-)|(^#|&)(access_token|error)=/.test(location.hash)||/[?&](app|live)(=|&|$)/.test(location.search);
 if(resume==='tour'){setTimeout(runTour,500);return;}
 if(resume==='app')return;
 if(deep){if(!LANG)askLang(null);return;}
 showIntro();}
function enterApp(){FLOW.on=false;S.view='';showView('feed');}

/* ---- the landing page ---- */
let TR=null,trRaf=0,trT=0,trPlaying=true,trLast=0,trSnd=null;
function showIntro(){FLOW.on=true;S.view='intro';document.body.classList.add('introon');
 const how=[['play','Watch','Swipe through the reels, one tattva in each.'],['book','Understand','Open the meaning, word by word.'],['mic','Sing','Sing the verse. Your pitch is scored live.'],['chakra','Play','Four games for every tattva, alone or with friends.'],['diya','Share','Light the diya when you learn one, and make your own reel.']];
 const el=document.createElement('div');el.id='intro';el.className='hland';el.setAttribute('role','dialog');el.setAttribute('aria-label','Hey Tattva');
 el.innerHTML='<header class="itop"><div class="logo"><span class="crest">'+yantra()+'</span>Hey Tattva</div><button class="ibtn sm" data-go>'+esc(LX('Enter'))+'</button></header>'+
  '<section class="ihero"><div class="iyan">'+yantra()+'</div><div class="iom">ॐ</div><p class="ikick">'+esc(LX('Dakṣiṇāmūrti Aṣṭakam · Ādi Śaṅkara'))+'</p><h1>Hey Tattva</h1><p class="idv">हे तत्त्व</p>'+
   '<p class="ilead">'+esc(LX('Eight verses. Eight truths about who you really are. Learn them the way you scroll.'))+'</p>'+
   '<button class="ienter" data-go><span>'+esc(LX('Enter the experience'))+'</span>'+ico('right')+'</button><a class="iwatch" href="#i-trailer">'+ico('play')+'<span>'+esc(LX('Watch the trailer'))+'</span></a></section>'+
  '<section class="iwwh">'+
   '<article class="iw"><span class="iwk"><b>01</b>'+esc(LX('What'))+'</span><h2>'+esc(LX('A reel for every verse'))+'</h2><p>'+esc(LX('Hey Tattva turns the Dakṣiṇāmūrti Aṣṭakam into short reels. Eight verses by Ādi Śaṅkara, each holding one tattva, a truth about the Self. Every verse comes with its meaning word by word, a 3D film, a song and games.'))+'</p></article>'+
   '<article class="iw"><span class="iwk"><b>02</b>'+esc(LX('Why'))+'</span><h2>'+esc(LX('Old wisdom, easy to start'))+'</h2><p>'+esc(LX('These verses are more than a thousand years old and not easy to begin. A short reel is. Watching makes you curious, singing makes the words stay, playing makes the meaning yours.'))+'</p></article>'+
   '<article class="iw ihw"><span class="iwk"><b>03</b>'+esc(LX('How'))+'</span><h2>'+esc(LX('Five simple steps'))+'</h2><ol>'+how.map((h,i)=>'<li><i>'+ico(h[0])+'</i><div><b>'+esc(LX(h[1]))+'</b><span>'+esc(LX(h[2]))+'</span></div></li>').join('')+'</ol></article></section>'+
  '<section class="isec" id="i-trailer"><h2 class="ish"><span>'+esc(LX('The trailer'))+'</span></h2><div class="trbox" id="trbox"></div>'+
   '<div class="trctl"><button class="tpill glass" id="tr-play"></button><button class="tpill glass" id="tr-re">'+ico('remix')+'<span>'+esc(LX('Replay'))+'</span></button><button class="tpill glass" id="tr-snd"></button><div class="trbar"><i id="tr-bar"></i></div></div></section>'+
  '<section class="isec idemo"><h2 class="ish"><span>'+esc(LX('See it in action'))+'</span></h2><div class="iphone"><video id="i-demo" src="video/demo.mp4" poster="video/demo.jpg" muted playsinline loop preload="metadata" controls></video></div><p class="inote">'+esc(LX('A real walk through the app on a phone.'))+'</p></section>'+
  '<section class="isec"><h2 class="ish"><span>'+esc(LX('The eight tattvas'))+'</span></h2><div class="i8">'+TATTVAS.map(T=>{const x=TL(T.n);return'<div class="i8c">'+tsym(T.n,'tsy')+'<b>'+T.n+'</b><span>'+esc(x.name)+'</span></div>';}).join('')+'</div></section>'+
  '<section class="iend"><div class="iyan sm">'+yantra()+'</div><h2>'+esc(LX('Ready?'))+'</h2><button class="ienter" data-go><span>'+esc(LX('Enter the experience'))+'</span>'+ico('right')+'</button><p class="inote">'+esc(LX('Free. No sign-in needed to watch, sing and play.'))+'</p></section>'+
  '<footer class="ifoot"><span class="crest">'+yantra()+'</span>'+esc(LX('Made with devotion by Laksh'))+'</footer>';
 document.body.appendChild(el);
 el.querySelectorAll('[data-go]').forEach(b=>b.onclick=leaveIntro);
 const dv=el.querySelector('#i-demo');dv.addEventListener('error',()=>{const sec=dv.closest('.idemo');if(sec)sec.hidden=true;},true);fetch('video/demo.mp4',{method:'HEAD'}).then(r=>{if(!r.ok)dv.closest('.idemo').hidden=true;}).catch(()=>{});
 el.querySelector('.iwatch').onclick=e=>{e.preventDefault();el.querySelector('#i-trailer').scrollIntoView({behavior:'smooth',block:'center'});};
 const box=el.querySelector('#trbox');try{TR=TRAILER.mount(box);}catch(e){TR=null;box.classList.add('nogl');}
 if(/[?&]rec(=|&|$)/.test(location.search))window.HT_TRAILER=TR;
 const pb=el.querySelector('#tr-play'),sb=el.querySelector('#tr-snd'),bar=el.querySelector('#tr-bar');
 const paintBtns=()=>{pb.innerHTML=ico(trPlaying?'pause':'play')+'<span>'+esc(LX(trPlaying?'Pause':'Play trailer'))+'</span>';sb.innerHTML=ico(trSnd?'son':'soff')+'<span>'+esc(LX(trSnd?'Sound off':'Sound on'))+'</span>';};
 pb.onclick=()=>{trPlaying=!trPlaying;paintBtns();if(trSnd){if(trPlaying)trSnd.a.play().catch(()=>{});else trSnd.a.pause();}};
 el.querySelector('#tr-re').onclick=()=>{trT=0;trPlaying=true;paintBtns();if(trSnd){trSnd.a.currentTime=0;trSnd.a.play().catch(()=>{});}};
 sb.onclick=()=>{if(trSnd){trSnd.a.pause();trSnd=null;}else{const a=new Audio('audio/drone_tanpura.m4a');a.loop=true;a.volume=.8;a.currentTime=trT%50;a.play().catch(()=>{});trSnd={a};}paintBtns();};
 paintBtns();
 // play the trailer only while it is on screen
 let seen=false;const io=new IntersectionObserver(es=>{seen=es[0].isIntersecting;},{threshold:.15});io.observe(box);
 const loop=now=>{trRaf=requestAnimationFrame(loop);const dt=Math.min(.1,(now-(trLast||now))/1000);trLast=now;if(!seen||!TR)return;if(trPlaying)trT=(trT+dt)%TR.len;TR.render(trT);bar.style.width=(trT/TR.len*100)+'%';};
 if(!window.HT_TRAILER)trRaf=requestAnimationFrame(loop);
 el.__io=io;applyI18n(el);}
function leaveIntro(){const el=document.getElementById('intro');if(!el)return;cancelAnimationFrame(trRaf);if(trSnd){trSnd.a.pause();trSnd=null;}if(el.__io)el.__io.disconnect();
 const v=el.querySelector('#i-demo');if(v)v.pause();
 el.classList.add('out');setTimeout(()=>{if(TR){TR.dispose();TR=null;}el.remove();document.body.classList.remove('introon');},450);
 if(FLOW.keep()){enterApp();setTimeout(runTour,600);}else askLang(()=>{enterApp();setTimeout(runTour,500);});}

/* ---- the language step: every time, unless "Remember this language" is on ---- */
function askLang(done){const el=document.createElement('div');el.className='langscreen';el.setAttribute('role','dialog');el.setAttribute('aria-label','Choose your language');let pick=lang(),keep=false;
 el.innerHTML='<div class="lsy">'+yantra()+'</div><div class="lsom">ॐ</div><div class="lst"><h1>Hey Tattva</h1><p class="dv">हे तत्त्व</p></div>'+
  '<h2 class="lsh">'+esc(LX('Choose your language'))+'</h2><div class="lops">'+langButtons()+'</div>'+
  '<button class="lkeep" id="ls-keep" role="switch" aria-checked="false"><i></i><div><b>'+esc(LX('Remember this language'))+'</b><span>'+esc(LX('Don’t ask again when I open the app.'))+'</span></div></button>'+
  '<button class="btn gold" id="ls-go">'+esc(LX('Continue'))+'</button><p class="lsn">'+esc(LX('You can change it any time in Me → Language.'))+'</p>';
 (document.getElementById('app')).appendChild(el);const paint=()=>{el.querySelectorAll('.lopt').forEach(b=>b.classList.toggle('on',b.dataset.l===pick));const k=el.querySelector('#ls-keep');k.classList.toggle('on',keep);k.setAttribute('aria-checked',keep);};paint();
 el.querySelectorAll('.lopt').forEach(b=>b.onclick=()=>{pick=b.dataset.l;paint();});el.querySelector('#ls-keep').onclick=()=>{keep=!keep;paint();};
 el.querySelector('#ls-go').onclick=()=>{FLOW.setKeep(keep);
  if(pick!==lang()){try{sessionStorage.setItem('tr-resume',done?'tour':'app');}catch(e){}setLang(pick);return;}
  setLang(pick,true);el.classList.add('out');setTimeout(()=>el.remove(),400);if(done)done();};}

/* ---- the guided tour: coach marks on the real buttons, every visit ---- */
function vis(sel){const els=[...document.querySelectorAll(sel)];return els.find(e=>{const r=e.getBoundingClientRect();return r.width>4&&r.height>4&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&getComputedStyle(e).visibility!=='hidden';});}
function curReel(sel){const el=reelNode(S.idx)||document.querySelector('#reels .reel');const b=el?el.querySelector(sel):null;return b&&b.getBoundingClientRect().width>4?b:null;}
function runTour(tries){tries=tries||0;if(document.querySelector('.tour'))return;
 if((S.view!=='feed'||!document.querySelector('#reels [data-a="learn"]'))&&tries<25){setTimeout(()=>runTour(tries+1),200);return;}if(S.view!=='feed')return;
 const steps=[{t:'Welcome to Hey Tattva',d:'A 30-second tour of what each button does.'},
  {el:()=>document.querySelector('#reels'),d:'This is a reel. Swipe up for the next tattva, tap to pause.',pad:-30},
  {el:()=>vis('#snd'),d:'Tap here to hear the verse and the music.'},
  {el:()=>curReel('[data-a="learn"]'),d:'Light the diya when you have learnt this tattva.'},
  {el:()=>curReel('[data-a="read"]'),d:'Open the meaning of the verse, word by word.'},
  {el:()=>curReel('[data-a="remix"]'),d:'Make your own reel of this verse: your music, your voice.'},
  {el:()=>curReel('[data-a="share"]'),d:'Send this reel to a friend.'},
  {el:()=>vis('#nv-games'),d:'Play the tattvas: four games, alone or live with friends.'},
  {el:()=>vis('#nv-create'),d:'Create a reel: pick a tattva, instruments and sing the shloka.'},
  {el:()=>vis('#nv-top'),d:'Your page: tattvas learnt, your reels, scores, name and language.'},
  {t:'That’s it. Start with the first tattva.',end:true}].filter(s=>!s.el||s.el());
 const ov=document.createElement('div');ov.className='tour';ov.setAttribute('role','dialog');ov.setAttribute('aria-label',LX('Quick tour'));
 ov.innerHTML='<div class="tspot"></div><div class="tcard" data-notr><div class="tcnt"></div><p class="tdesc"></p><div class="tbtns"><button class="tskip"></button><span class="tdots"></span><button class="tback"></button><button class="tnext"></button></div></div>';
 document.body.appendChild(ov);let i=0;const spot=ov.querySelector('.tspot'),card=ov.querySelector('.tcard');
 const close=()=>{ov.classList.add('out');removeEventListener('resize',place);setTimeout(()=>ov.remove(),300);};
 function place(){const s=steps[i],e=s.el&&s.el();const W=innerWidth,H=innerHeight;card.style.left=card.style.top='';card.classList.remove('up','down','mid');
  if(!e){spot.style.cssText='left:50%;top:50%;width:0;height:0';card.classList.add('mid');return;}
  const r=e.getBoundingClientRect(),p=s.pad!=null?s.pad:8,x=Math.max(4,r.left-p),y=Math.max(4,r.top-p),w=Math.min(W-8,r.right+p)-x,h=Math.min(H-8,r.bottom+p)-y,rad=Math.min(26,Math.min(w,h)/2);
  spot.style.cssText='left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;border-radius:'+rad+'px';
  const cw=Math.min(340,W-24),ch=card.offsetHeight||170;let cx=Math.max(12,Math.min(W-cw-12,r.left+r.width/2-cw/2)),cy;
  if(h>H*.6){cy=H/2-ch/2;cx=Math.max(12,Math.min(W-cw-12,x+w/2-cw/2));card.classList.add('mid');}
  else if(y+h+ch+18<H){cy=y+h+12;card.classList.add('down');}else{cy=y-ch-12;card.classList.add('up');}
  card.style.left=cx+'px';card.style.top=Math.max(12,cy)+'px';card.style.width=cw+'px';card.style.setProperty('--ax',Math.max(18,Math.min(cw-18,r.left+r.width/2-cx))+'px');}
 function show(){const s=steps[i],n=steps.length;
  ov.querySelector('.tcnt').innerHTML=s.t?'<h3>'+esc(LX(s.t))+'</h3>':'<span class="tstep">'+esc(LX('Quick tour'))+' · '+esc(LX('{i} of {n}').replace('{i}',i).replace('{n}',n-2))+'</span>';
  ov.querySelector('.tdesc').textContent=s.d?LX(s.d):'';ov.querySelector('.tdesc').hidden=!s.d;
  ov.querySelector('.tskip').textContent=LX('Skip');ov.querySelector('.tskip').hidden=!!s.end;
  ov.querySelector('.tback').textContent=LX('Back');ov.querySelector('.tback').hidden=i===0||!!s.end;
  ov.querySelector('.tnext').textContent=LX(s.end?'Begin':'Next');
  ov.querySelector('.tdots').innerHTML=steps.map((x,k)=>'<i class="'+(k===i?'on':'')+'"></i>').join('');
  card.classList.remove('in');void card.offsetWidth;card.classList.add('in');place();requestAnimationFrame(place);}
 ov.querySelector('.tnext').onclick=()=>{if(i>=steps.length-1){close();return;}i++;show();};
 ov.querySelector('.tback').onclick=()=>{if(i>0){i--;show();}};ov.querySelector('.tskip').onclick=close;
 ov.addEventListener('keydown',e=>{if(e.key==='Escape')close();});addEventListener('resize',place);show();setTimeout(()=>ov.querySelector('.tnext').focus(),50);}
