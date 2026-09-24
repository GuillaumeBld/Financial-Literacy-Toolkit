# Lisière

La foule a un prix. Jev a une distribution. L'écart est la scène.

Les marchés ouverts viennent de l'API publique Polymarket (la même source que [polymarket-paper-trader](https://github.com/agent-next/polymarket-paper-trader)). Quatre questions partent ensemble : la question est-elle nette, le premier résultat arrive-t-il, le fait est-il solide, l'écart vaut-il un papier. Le code seul décide. Un papier de 100 € s'ouvre sur cet appareil, au prix de la foule. Rien n'est envoyé à un carnet d'ordres.

La commande affichée reprend le geste du dépôt étoilé :

```bash
pm-trader buy <slug> <résultat> 100
```

Sans `TYPESAFE_API_KEY`, ou si la case « Envoyer à Jev » est libre, une lecture locale fait bouger les mêmes barres. Elle sert à répéter. Elle n'est pas Jev.

```bash
pnpm --filter lisiere dev
```

http://localhost:3220

Les prix en direct se rafraîchissent. La lecture Jev ne bouge que quand vous relisez. Les deux horloges sont séparées : la foule peut glisser pendant que la distribution reste en place.
