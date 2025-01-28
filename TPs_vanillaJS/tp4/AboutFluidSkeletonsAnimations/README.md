### EXPLICATION ANIMATION BLENDING AVEC DES POIDS.
Ici on définit tout les animations que l'on va utiliser avec la méthode "beginWeightedAnimation"

Dans cet exemple il y a les animation " IDLE ", " WALKING " et " RUNNING " 

```js
let idleAnim = scene.beginWeightedAnimation(skeletons[0], 160, 661, 1.0, true, 1);
let walkAnim = scene.beginWeightedAnimation(skeletons[0], 735, 810, 0, true, 10);
let runAnim= scene.beginWeightedAnimation(skeletons[0], 672, 704, 0, true, 0.5);
``` 
La méthode beginWeightedAnimation prend les mêmes arguments que la méthode plus classique beginAnimation.


Ces arguments sont: 
 - La target de l'animation ici skeletons[0].
 Je pense qu'on pourrait juste mettre skeleton puisque qu'il y en à qu'un seul. Mais il faut faire attention dans ce cas qu'il n'y en ai pas plusieurs. À mon avis cela dépend de comment est exporté le modèle. personnellement j'ai importé dans blender le mannequin déjà rigged et après les animations. Puis j'ai tout renommé pour ne pas me perdre et ensuite, j'ai supprimé les squelettes reliés aux animation pour ne conserver que le squelette principal.
 Pour faire ça j'ai suivi le tutoriel disponible sur: 
 https://doc.babylonjs.com/extensions/Exporters/Mixamo_to_Babylon
 
 (On peut voir le squelette ainsi que son ID en faisant un CTRL + F de skeleton sur le fichier .babylon)

 - La frame du début de l'animation
 - La frame de fin de l'animation
Ici je n'ai pas mis exactement les frames du début et de fin car il y avait quelques "bugs" visuels sûrement dûs aux autres animations utilisant les frames proches de l'animation en cours.

 - Le poids par défaut de l'animation (de 0.0 à 1.0)
 - Si on veut que l'animation se répète où se joue une seule fois (true ou false)
 - La vitesse de l'animation


Pour changer le poids d'une animation on le fait comme ceci : 

```js
idleAnim.weight = 1.0;
walkAnim.weight = 0.0;
runAnim.weight = 0.0;
```
Si le poids est à 1.0 l'animation se joue.
Si le poids est à 0.0 l'animation est en pause.

Je n'en suis pas tout à fait sur mais je pense que le total des poids des animations ne doit pas exceder 1.0

Donc on peut avoir par exemple :
```js
idleAnim.weight = 0.7;
walkAnim.weight = 0.2;
runAnim.weight = 0.1;
```
Mais pas :
```js
idleAnim.weight = 0.9;
walkAnim.weight = 0.5;
runAnim.weight = 0.9;
```

De ce fait avec les poids sur les animations on peut les fusionner pour avoir des transitions entre elles plus fluide.
J'ai pensé peut être que l'on pourrait faire une fonction quand on appuie sur la touche "up" pour avancer par exemple qui fait passer de l'aniamtion de idle à walk
en faisant comme ceci.
(Je n'ai pas encore testé si cela marcherai mais je pense que oui)

Pseudo-code:

if (KeyPressedUP == true && Idle == true)
startWalking()

function startWalking(){
    Idle  = false
    for (i = 0; i< 10; i++){
        idleAnim.weight -= 0.1
        walkAnim.weight += 0.1;
    }
}

On pourrait ainsi généraliser cette fonction pour l'appliquer à différentes animations.

La documentation correspondante:
https://doc.babylonjs.com/divingDeeper/animation/advanced_animations 

Dans la partie Animation Blending

### COMMENT TROUVER LES FRAMES CORRESPONDANTES

Pour les Meshes sous le format .babylon (je n'ai pas essayé les autres format avec blender j'exporte tout directement sous le format babylon).

Dans le fichier .babylon du personnage on peut trouver toutes les animations en recherchant le mot <ins>"ranges"</ins> avec CTRL + F.
Vous pourrez ensuite trouver une ligne comme celle-ci:

```json
"ranges":[{"name":"Death","from":0,"to":151},{"name":"Idle","from":160,"to":661},{"name":"Running","from":670,"to":706},{"name":"TPose","from":720,"to":722},{"name":"Walking","from":730,"to":813}]}]
```

Cette ligne correspond à toutes les animation que le mesh possède.
Chaque animation à un nom, la frame de début et la frame de fin.
Ici on voit qu'il y a 5 animation différentes:
 - Death de la frame 0 à 151
 - Idle de la frame 160 à 661
 - Running de la frame 670 à 706
 - TPose de la frame 720 à 722
 - Walking de la frame 730 à 813

J'ai renommé moi-même ces animations en suivant le tutoriel proposé sur: https://doc.babylonjs.com/extensions/Exporters/Mixamo_to_Babylon
Sans ce renommage les animations auraient le nom "Armature.001", "Armature.002" etc.. et cela ferait perdrebeaucoup de temps.


# NB 
Pour avoir des informations importantes sur votre mesh: 
CTRL + F et recherchez le mot "meshes"
Vous obtiendrez alors la ligne :

```json
"meshes":[{"name":"Jolleen","id":"Jolleen","materialId":"Material","billboardMode":0,"position":[0,0,0],"rotation":[0,0,0],"scaling":[1,1,1], "..."}]
````

Le nom du mesh ici est Jolleen qui est important pour pouvoir importer le mesh (nom modifié à la main sur blender)

