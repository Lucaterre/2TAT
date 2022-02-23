/**
 * Annotation view and event/requests handlers using custom RecogitoJS (https://github.com/recogito/recogito-js)*
 **/

(function() {
    // Get user mapping (label/color) from user config (db)
    const fetchMapping = fetch("/mapping")
        .then((response) => response.json())
        .then((user) => {
            return user;
        });

    // Get labels statitics (db)
    const fetchStatsLabel = fetch("/get_statitics")
        .then((response) => response.json())
        .then((user) => {
            return user;
        });

    const addLabelsStatsInfo = async () => {

        const stats = await fetchStatsLabel;
        for (const [key, value] of Object.entries(stats)) {
            document.getElementById('entityLabelCount-'+key).textContent = value;
        }
    };

    addLabelsStatsInfo();

    // Create a new CSS style container for specific mapping
    const stylizeMapping = async () => {
        let style       = document.createElement('style')
        style.type      = 'text/css';
        style.innerHTML = ""
        const mapping   = await fetchMapping;
        for (let key in mapping){
            style.innerHTML += "." +key+ "{background-color:" + mapping[key] +";} "
        }
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    stylizeMapping();

    /*
    * Custom Recogito Widgets
    *
    * 1. colorLabelSelectorWidget : Dynamics color highlight label assignation (formater) with tagging property ;
    * 2. mentionLabelWidget       : Give current mention and label information to the user in infobox.
    */
    const colorLabelSelectorWidget =  function (args) {
        // Find a current color setting in the annotation, if any
        let currentColorBody = args.annotation ?
            args.annotation.body.find(function (b) {
                return b.purpose  === 'highlighting';
            }) : null;
        // Keep the value in a variable
        let currentColorValue = currentColorBody ? currentColorBody.value : null;
        // Triggers callbacks on user action (here combined highlight & tagging actions)
        let addTag = function (evt) {
            if (currentColorBody) {
                args.onUpdateBody(currentColorBody, {
                    type: 'TextualBody',
                    purpose: 'highlighting',
                    value: evt.target.dataset.tag
                });

            } else {
                args.onAppendBody({
                    type: 'TextualBody',
                    purpose: 'highlighting',
                    value: evt.target.dataset.tag
                });
            }
        }
        let addLabel = function (evt) {
            if (currentColorBody) {
                args.onUpdateBody(currentColorBody, {
                    type: 'TextualBody',
                    purpose: 'tagging',
                    value: evt.target.dataset.tag
                });

            } else {
                args.onAppendBody({
                    type: 'TextualBody',
                    purpose: 'tagging',
                    value: evt.target.dataset.tag
                });
            }
        }
        // This part renders the UI elements
        const createButton = function (value) {
            let button = document.createElement('button');
            if (value === currentColorValue)
                button.className = 'selected';
            button.className             = value;
            button.textContent           = value;
            button.dataset.tag           = value;
            button.style.backgroundColor = value;
            button.classList.add("btn");
            button.addEventListener('click', addTag);
            button.addEventListener('click', addLabel);
            return button;
        }
        let container = document.createElement('div');
        let title     = document.createElement('h3');
        let line      = document.createElement('hr');
        // add attribute / content
        container.className = 'colorselector-widget';
        title.textContent = "Labels"
        // add children to DOM
        container.appendChild(title);
        container.appendChild(line);

        // This part render label button with specified mapping
        const stylizeBox = async () => {
            const mapping = await fetchMapping;
            for (var key in mapping){
                var button = createButton(key);
                container.appendChild(button);
            }
        };
        stylizeBox();
        return container;
    }
    // style formatter for applying color on labels
    const ColorFormatter = function (annotation) {
        let highlightBody = annotation.body.find(function (b) {
            return b.purpose === 'highlighting';
        });
        if (highlightBody) {
            return highlightBody.value;
        }
    }

    const MentionLabelWidget = function(args){

        let actualMention = args.annotation.underlying.target.selector[0].exact

        let title  = document.createElement('h3');
        var line = document.createElement('hr');
        var container = document.createElement('div');
        var labelMentionInput = document.createElement('label')
        var form  = document.createElement('form');
        var inputMention = document.createElement('input');
        var labelLabelInput = document.createElement('label')
        var inputLabel = document.createElement('input');


        title.textContent = "Description"



        labelMentionInput.setAttribute("for", "mention")
        labelMentionInput.textContent = "Mention"


        form.className = "form-group"


        inputMention.setAttribute('disabled', true)
        inputMention.setAttribute('size', 30)
        inputMention.id = "mention"
        inputMention.name = "mention"
        inputMention.value = actualMention
        inputMention.className = "form-control"


        labelLabelInput.setAttribute("for", "label")
        labelLabelInput.textContent = "Label"


        inputLabel.setAttribute('disabled', true)
        inputLabel.setAttribute('size', 15)
        inputLabel.id = "label"
        inputLabel.name = "label"
        inputLabel.className = "form-control"

        try{
            inputLabel.value = args.annotation.underlying.body[0].value
        }catch{
            inputLabel.value = ""
        }




        form.appendChild(labelMentionInput)
        form.appendChild(inputMention)
        form.appendChild(labelLabelInput)
        form.appendChild(inputLabel)

        container.appendChild(title)
        container.appendChild(line)
        container.appendChild(form)
        return container
    };




    // Init annotation DOM container
    const textContent = document.getElementById('text');

    // Init Recogito JS annotation object
    let r = Recogito.init({
        content: textContent,
        widgets: [
            MentionLabelWidget, colorLabelSelectorWidget
        ],
        formatter: ColorFormatter,
        // Use option "pre" meanly the text comes is pre-formated
        // (important for the offsets)
        mode:"pre"
    });


    // loaded the previous annotations (from db)

    r.loadAnnotations("/annotations");

    const ResetAllDemoAnnotsBtn = document.getElementById("added-all-annotations");
    ResetAllDemoAnnotsBtn.onclick = window.onload = reloadDemoAnnotations;

    function reloadDemoAnnotations(){
        r.clearAnnotations();
        resetListsMentions();
        r.loadAnnotations("/reload_demo_annotations").then(function () {
             var allAnnotations = r.getAnnotations();
             for (var annotation in allAnnotations){
              updateListControl(allAnnotations[annotation], 'more');
             }
         })
    }


    // add listener to actual list
    var allButtons = document.getElementsByClassName('btn-remove');
    for (var i = 0; i < allButtons.length; i++) {
        allButtons[i].addEventListener('click', function (event) {
            RemoveAllItems(event);
        });
    }

    function RemoveAllItems(event){
        let target = event.target.closest('button');
        let itemList = target.id.split('/$-$/');
        let label = itemList[1];
        let mention = itemList[2];
        var allAnnotations = r.getAnnotations();
        for (var annotation in allAnnotations){
            var m = allAnnotations[annotation].target.selector[0].exact;
            var l = allAnnotations[annotation].body[0].value
            if (m === mention && l === label){
                // send request to remove annotation
                async function remove () {
                    await sendData({destroyAll:false, destroyOne : allAnnotations[annotation]}, '/destroy_annotations')
                };
                remove();
                // remove annotation from Textcontent
                r.removeAnnotation(allAnnotations[annotation]);
                // update list mentions
                updateListControl(allAnnotations[annotation], 'less');

            }
        }
    }



    /*
    * Event handlers for annotations :
    * 1. create
    * 2. delete
    * 3. update
    * 4. others : labels span on mention mouseover
    */

    function prepareData(annotation){
        let mention = annotation.target.selector[0].exact;
        let start   = annotation.target.selector[1].start;
        let end     = annotation.target.selector[1].end;
        let label   = annotation.body[0].value;
        return {
            id      : annotation.id,
            mention : mention,
            label   : label,
            start   : start,
            end     : end
        }
    }

    function sendData(data, url){
        fetch(url, {
            method  :"POST",
            headers : new Headers({"Content-Type" : "application/json"}),
            body    : JSON.stringify(data)
        }).then(
            function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' +
                        response.status);
                    return;
                }
                // Examine the text in the response
                response.json().then(function(data) {
                    console.log(data);
                });
            }
        )
            .catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    }

    function updateListControl(annotation, type){
        let mention = annotation.target.selector[0].exact;
        let label   = annotation.body[0].value;
        var actualCount = parseInt(document.getElementById("entityLabelCount-"+label).textContent);
        if(type === "more"){
            console.log(mention)
            let labelList = document.getElementById("list-"+label)
            try{
                let itemListBadge   = document.getElementById("list-badge-"+label+"-"+mention);
                var actualBadgeCount = parseInt(itemListBadge.textContent);
                itemListBadge.textContent = actualBadgeCount + 1;
            }catch {
                // add new list item
                var newListItemMention = document.createElement("li");
                var newListBadge = document.createElement("span");
                var newRemoveBtn = document.createElement("button");
                var timesIcon   = document.createElement('i');


                newListItemMention.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")
                newListBadge.className = "badge"
                newRemoveBtn.classList.add("btn", "btn-danger", "btn-sm");
                timesIcon.classList.add("fa", "fa-times");


                newListItemMention.id = "list-"+label+"-"+mention;
                newListBadge.id = "list-badge-"+label+"-"+mention;
                newRemoveBtn.id = "remove/$-$/"+label+"/$-$/"+mention;

                newRemoveBtn.addEventListener("click", RemoveAllItems)

                var textMention = document.createTextNode(mention);
                //newListItemMention.textContent = mention;
                newListBadge.textContent = 1;

                newRemoveBtn.appendChild(timesIcon);
                newListItemMention.appendChild(newRemoveBtn);
                newListItemMention.appendChild(textMention);

                newListItemMention.appendChild(newListBadge);
                labelList.appendChild(newListItemMention);
            }

            document.getElementById("entityLabelCount-"+label).textContent = actualCount+1
        }
        if (type === "less"){
            let mentionList = document.getElementById("list-"+label+"-"+mention)
            let itemListBadge   = document.getElementById("list-badge-"+label+"-"+mention);
            var actualBadgeCount = parseInt(itemListBadge.textContent);
            if (actualBadgeCount > 0) {
                itemListBadge.textContent = actualBadgeCount - 1;
            }
            var newActualBadgeCount = parseInt(itemListBadge.textContent);
            document.getElementById("entityLabelCount-"+label).textContent = actualCount-1
            if (newActualBadgeCount === 0){
                mentionList.remove();
            }


        }
    }



    r.on('createAnnotation', function (annotation) {
        let data = prepareData(annotation);
        sendData(data, "/new_annotation");
        updateListControl(annotation, "more");

    });



    r.on('deleteAnnotation', function (annotation) {
        console.log(annotation)
        let data = prepareData(annotation);
        sendData(data, "/delete_annotation");
        updateListControl(annotation, "less");


    });

    r.on('updateAnnotation', function (annotation, previous) {
        // get previous annotation informations here
        let data = prepareData(previous);
        // get new label to update annotation
        var newLabel = {updatedLabel : annotation.body[0].value};
        // concatenate previous and new data dict
        sendData(Object.assign({}, data, newLabel), "/update_annotation");

        // updateListControl(annotation, "more");
        updateListControl(previous, "less");
        updateListControl(annotation, "more");
    });


    function resetListsMentions(){
        const allListsMentions = document.querySelectorAll(".list-group");
        allListsMentions.forEach(function (ele) {
            var label = ele.id.split('-')[1];
            document.getElementById("entityLabelCount-" + label).innerText = "0";
            ele.innerHTML = "";
        })


        /*
            for (var ele in allListsMentions) {
                console.log(allListsMentions[ele])
                var label = allListsMentions[ele].id.split('-')[1]
                // get counter element
                document.getElementById("entityLabelCount-" + label).innerText = "0";
                allListsMentions[ele].innerHTML = "";
            }*/

    }

    // listener to destroy all annotations
    const button = document.getElementById("remove-all-annotations");
    button.addEventListener('click', function () {
        var b =  confirm('are you sure?');
        if (b){
            destroyAllHandler();
            resetListsMentions();
        }
    });





    function destroyAllHandler(){

        r.clearAnnotations().then(async function () {
            await sendData({destroyAll: true, destroyOne:false}, '/destroy_annotations');
        })
    }

    // listener for add span on hover
    textContent.onmouseover = textContent.onmouseout = spanHandler;
    function spanHandler(event) {
        let target = event.target;
        if (target.localName === "span" && target.className.split(' ')[0] === "r6o-annotation") {
            if (event.type === 'mouseover') {
                if(target.children.length === 0){
                    let newSpanLabel = document.createElement('span');
                    newSpanLabel.textContent = target.className.split(' ')[1];
                    newSpanLabel.className = "entityDescriptor";
                    target.appendChild(newSpanLabel);
                }
            }
            if (event.type === "mouseout") {
                target.removeChild(event.target.lastChild);
            }
        }
    }



    const annotationsArea = document.getElementById("number-annotations")
    annotationsArea.onclick  = listHandler;

    function listHandler(event) {
        let span
        let target = event.target;
        if (target.localName === "span"){
            span = target
            var label = span.className;
            var btnlist = document.getElementById("list-"+label);
            if (btnlist.style.display === "none"){
                btnlist.style.display = "block";
            }else{
                btnlist.style.display = "none";
            }
        }
    }




    // mouve on utils files functions
    const btnZoomIn = document.getElementById("zoomIn");
    const btnZoomOut = document.getElementById("zoomOut");

    function getEmSize(el) {
        return el.match(/(\d+)px/)[1];
    }

    btnZoomIn.addEventListener("click", () => {
        var actualFS = parseFloat(getEmSize(textContent.style.fontSize));
        if (actualFS !== 30){
            console.log(actualFS)
            actualFS = actualFS + 5;
            console.log(actualFS)
            textContent.style.fontSize = actualFS+"px" ;

        }
    });
    btnZoomOut.addEventListener("click", () => {
        var actualFS = parseFloat(getEmSize(textContent.style.fontSize));
        if (actualFS > 10) {
            console.log(actualFS)
            actualFS = actualFS - 5;
            console.log(actualFS)
            textContent.style.fontSize = actualFS + "px";
        }
    });



    // Search function
     // event listner to search mentions


    const searchInput = document.getElementById("myInput");
    const clearInput  = document.getElementById("clear-input-text")
    searchInput.onkeyup = searchInput.onfocus = searchInput.onblur =  clearInput.onclick = textContent.onclick =  myFunction;




    document.getElementById('myInput').value = "";

    function displayUl(type){
        document.querySelectorAll('ul').forEach(function(ul, index){
                ul.style.display = type;
            });
    }

    function myFunction(event) {
        var query = document.getElementById('myInput').value.toLowerCase().trim();
        var elements = document.querySelectorAll('ul > li');

        if (event.type === "focus"){
            displayUl('');
        }
        // search
        else if (event.type === "keyup"){
            for (var i = 0; i < elements.length; i ++) {
                var el = elements[i];
                if (el.innerText.replace(/[0-9]/g, '').toLowerCase().trim().indexOf(query)  > -1){
                    el.setAttribute('style', 'display: "" !important');
                }
                else{
                    el.setAttribute('style', 'display: none !important');
                }
            }
        }



        else if (event.type === "blur" && query.length === 0){
            displayUl('none');
        }
        else if (event.type === "click"){
            console.log(event)
            for (var i = 0; i < elements.length; i ++) {
                var el = elements[i];
                el.setAttribute('style', 'display: ""');
            }
            displayUl('none')
            document.getElementById('myInput').value = "";
        }

        /*
        if (event.type === "keyup"){
            document.querySelectorAll('ul').forEach(function(ul, index){
            ul.style.display = "block"
        });
            for (var i = 0; i < elements.length; i ++) {
                var el = elements[i];
                if (el.innerText.indexOf(query) > -1){
                    el.setAttribute('style', 'display: ""');
                }
                else{
                    el.setAttribute('style', 'display: none !important');
                }
            }

        }*/
        //else{

        //    for (var i = 0; i < elements.length; i ++) {
        //        var el = elements[i];
        //        el.setAttribute('style', 'display: ""');
        //    }
            //document.querySelectorAll('ul').forEach(function(ul, index){
            //ul.style.display = "none"
        //})
        // }
            /*
        else if (event.type === "blur" && query.length === 0 ){
            console.log(query.length)
            document.querySelectorAll('ul').forEach(function(ul, index){
            ul.style.display = "none";
        })


            for (var i = 0; i < elements.length; i ++) {
                var el = elements[i];
                el.setAttribute('style', 'display: ""');
            }
            document.querySelectorAll('ul').forEach(function (ul, index) {
                ul.style.display = "block"
            })
            document.getElementById('myInput').value = "";


        }else{

             document.getElementById('myInput').value = "";
        }
        // this wil grab all <li> elements from all <ul> elements on the page
        // however, you will want to specify a unique attribute for only the elements you wish to include
        */
    }























})();

