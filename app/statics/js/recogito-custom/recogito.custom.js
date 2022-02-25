/**
 * Custom annotation view using RecogitoJS (https://github.com/recogito/recogito-js)
 *
 * Date : 25/02/2021
 **/

(function() {
    // Init annotation DOM container
    const textContent            = document.querySelector('#text');
    // sometimes we can't access directly to the stylesheet
    const textPre                = window.getComputedStyle(document.getElementById('text'), null);
    // Init constants
    const totalAnnotationsSpan   = document.querySelector('#total-annotation');
    const mentionCountBadges     = document.querySelectorAll('.badge');
    const ResetAllDemoAnnotsBtn  = document.querySelector("#added-all-annotations");
    const RemoveAllAnnotsBtn     = document.querySelector("#remove-all-annotations");
    const btnZoomIn              = document.querySelector("#zoomIn");
    const btnZoomOut             = document.querySelector("#zoomOut");
    const searchInput            = document.querySelector("#search-input");
    const clearInput             = document.querySelector("#clear-input-text");
    const annotationsArea        = document.querySelector("#number-annotations");
    const allRemoveButtonsInList = document.querySelectorAll('.btn-remove');

    // Attach listeners functions to elements
    searchInput.onkeyup = searchInput.onfocus = searchInput.onblur = clearInput.onclick = textContent.onclick = queryMentions;
    btnZoomIn.onclick = btnZoomOut.onclick  = zoomText;
    annotationsArea.onclick = annotationsArea.onbind = listHandler;
    textContent.onmouseover = textContent.onmouseout = spanHandler;
    RemoveAllAnnotsBtn.onclick = RemoveAllAnnotations;
    ResetAllDemoAnnotsBtn.onclick = reloadDemoAnnotations;

    // Init fetch and send functions :
    // function to send data to backend
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

    // Get user mapping (label/color) from user config (db)
    const fetchMapping = fetch("/mapping")
        .then((response) => response.json())
        .then((res) => {
            return res;
        });

    // Get labels statitics (db)
    const fetchStatsLabel = fetch("/get_statitics")
        .then((response) => response.json())
        .then((res) => {
            return res;
        });

    // Init async utils functions :
    // Get numbers of entities in badges
    const addLabelsStatsInfo = async () => {
        await fetchStatsLabel.then((stats) => {
            for (const [label, value] of Object.entries(stats)) {
                document.querySelector('#entityLabelCount-' + label).textContent = value.toString();
            }
        });
    };
    // Add a specific colors mapping for labels
    const stylizeMapping = async () => {
        let style       = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.innerHTML = "";
        await fetchMapping.then((mapping) =>{
            for (const [label, color] of Object.entries(mapping)) {
                style.innerHTML += "."+label+"{background-color:"+color+";}";
            }
            document.querySelectorAll('head')[0].appendChild(style);
        });
    };

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
        const addTag = function (evt) {
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
        const addLabel = function (evt) {
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
            if (value === currentColorValue){
                button.className = 'selected';
            }
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
            for (let key in mapping){
                let button = createButton(key);
                container.appendChild(button);
            }
        };
        stylizeBox().then();
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
        let actualMention     = args.annotation.underlying.target.selector[0].exact
        let title             = document.createElement('h3');
        let line              = document.createElement('hr');
        let container         = document.createElement('div');
        let labelMentionInput = document.createElement('label')
        let form              = document.createElement('form');
        let inputMention      = document.createElement('input');
        let labelLabelInput   = document.createElement('label')
        let inputLabel        = document.createElement('input');
        title.textContent = "Description";
        labelMentionInput.setAttribute("for", "mention");
        labelMentionInput.textContent = "Mention";
        form.className = "form-group";
        inputMention.setAttribute('disabled', 'true');
        inputMention.setAttribute('size', '30');
        inputMention.id = "mention";
        inputMention.name = "mention";
        inputMention.value = actualMention;
        inputMention.className = "form-control";
        labelLabelInput.setAttribute("for", "label");
        labelLabelInput.textContent = "Label";
        inputLabel.setAttribute('disabled', 'true');
        inputLabel.setAttribute('size', '15');
        inputLabel.id = "label";
        inputLabel.name = "label";
        inputLabel.className = "form-control";
        try{
            inputLabel.value = args.annotation.underlying.body[0].value;
        }catch{
            inputLabel.value = "";
        }
        form.appendChild(labelMentionInput);
        form.appendChild(inputMention);
        form.appendChild(labelLabelInput);
        form.appendChild(inputLabel);
        container.appendChild(title);
        container.appendChild(line);
        container.appendChild(form);
        return container;
    };

    /*
    *    BASE
    */
    // Init Recogito JS annotation object
    const Recogito = window.Recogito;
    const r = Recogito.init({
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

    // Apply init functions and set values elements on page reload
    searchInput.value = "";
    addLabelsStatsInfo().then();
    stylizeMapping().then();

    // Specific handlers for recogito : https://github.com/recogito/recogito-js/wiki/API-Reference
    r.on('createAnnotation', function (annotation) {
        let data = prepareData(annotation);
        sendData(data, "/new_annotation");
        updateListControl(annotation, "more");
    });

    r.on('deleteAnnotation', function (annotation) {
        let data = prepareData(annotation);
        sendData(data, "/delete_annotation");
        updateListControl(annotation, "less");
    });

    r.on('updateAnnotation', function (annotation, previous) {
        // get previous annotation informations here
        let data = prepareData(previous);
        // get new label to update annotation
        let newLabel = {updatedLabel : annotation.body[0].value};
        // concatenate previous and new data dict
        sendData(Object.assign({}, data, newLabel), "/update_annotation");

        // updateListControl(annotation, "more");
        updateListControl(previous, "less");
        updateListControl(annotation, "more");
    });

    /*
    * Utils functions
    */

    // Count total annotations and set value in general badge
    const sumAnnots = (totalAnnotationsCounter) => {
        let count = 0;
        mentionCountBadges.forEach(function (badge){
            count += parseInt(badge.innerHTML);
        });
        totalAnnotationsCounter.textContent = count;
    }

    //Remove all annotations
    const addRemoveEventOnAll = (allRemoveBtnList)=> {
        allRemoveBtnList.forEach(function (btn) {
            btn.onclick = RemoveAllItems;
        });
    }

    // Init functions on page reload
    sumAnnots(totalAnnotationsSpan);
    addRemoveEventOnAll(allRemoveButtonsInList);

    // Reload demo annotations
    function reloadDemoAnnotations(){
        r.clearAnnotations();
        resetListsMentions();
        r.loadAnnotations("/reload_demo_annotations").then(function () {
            let allAnnotations = r.getAnnotations();
            for (let annotation in allAnnotations){
                updateListControl(allAnnotations[annotation], 'more');
            }
        })
    }

    // Data wrapper
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

    // Updated list information on recogito events
    function updateListControl(annotation, type){
        let mention = annotation.target.selector[0].exact;
        let label   = annotation.body[0].value;
        let actualCount = parseInt(document.getElementById("entityLabelCount-"+label).textContent);
        if(type === "more"){
            let labelList = document.getElementById("list-"+label)
            try{
                let itemListBadge   = document.getElementById("list-badge-"+label+"-"+mention);
                let actualBadgeCount = parseInt(itemListBadge.textContent);
                itemListBadge.textContent = actualBadgeCount + 1;
            }catch {
                // add new list item
                let newListItemMention = document.createElement("li");
                let newListBadge = document.createElement("span");
                let newRemoveBtn = document.createElement("button");
                let timesIcon   = document.createElement('i');


                newListItemMention.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center")
                newListBadge.className = "badge"
                newRemoveBtn.classList.add("btn", "btn-danger", "btn-sm");
                timesIcon.classList.add("fa", "fa-times");


                newListItemMention.id = "list-"+label+"-"+mention;
                newListBadge.id = "list-badge-"+label+"-"+mention;
                newRemoveBtn.id = "remove/$-$/"+label+"/$-$/"+mention;

                newRemoveBtn.addEventListener("click", RemoveAllItems)

                let textMention = document.createTextNode(mention);
                //newListItemMention.textContent = mention;
                newListBadge.textContent = "1";

                newRemoveBtn.appendChild(timesIcon);
                newListItemMention.appendChild(newRemoveBtn);
                newListItemMention.appendChild(textMention);

                newListItemMention.appendChild(newListBadge);
                labelList.appendChild(newListItemMention);
            }

            document.getElementById("entityLabelCount-"+label).textContent = actualCount+1;
            totalAnnotationsSpan.textContent = parseInt(totalAnnotationsSpan.textContent) + 1;
        }
        if (type === "less"){
            let mentionList = document.getElementById("list-"+label+"-"+mention);
            let itemListBadge   = document.getElementById("list-badge-"+label+"-"+mention);
            let actualBadgeCount = parseInt(itemListBadge.textContent);
            if (actualBadgeCount > 0) {
                itemListBadge.textContent = actualBadgeCount - 1;
            }
            let newActualBadgeCount = parseInt(itemListBadge.textContent);
            document.getElementById("entityLabelCount-"+label).textContent = actualCount-1;
            totalAnnotationsSpan.textContent = parseInt(totalAnnotationsSpan.textContent) - 1;
            if (newActualBadgeCount === 0){
                mentionList.remove();
            }
        }
    }

    // Remove all annotations for one label on text view and send information to backend
    function RemoveAllItems(event){
        let target = event.target.closest('button');
        let itemList = target.id.split('/$-$/');
        let label = itemList[1];
        let mention = itemList[2];
        let allAnnotations = r.getAnnotations();
        for (let annotation in allAnnotations){
            let currentAnnotations = allAnnotations[annotation];
            let m = currentAnnotations.target.selector[0].exact;
            let l = currentAnnotations.body[0].value;
            if (m === mention && l === label){
                // send request to remove annotation
                async function remove () {
                    await sendData({destroyAll:false, destroyOne : currentAnnotations}, '/destroy_annotations');
                }
                remove().then();
                // remove annotation from Textcontent
                r.removeAnnotation(allAnnotations[annotation]);
                // update list mentions
                updateListControl(allAnnotations[annotation], 'less');
            }
        }
    }

    // Reset list information
    function resetListsMentions(){
        const allListsMentions = document.querySelectorAll(".list-group");
        totalAnnotationsSpan.textContent = "0";
        allListsMentions.forEach(function (ele) {
            let label = ele.id.split('-')[1];
            document.getElementById("entityLabelCount-" + label).innerText = "0";
            ele.innerHTML = "";
        })
    }

    // Destroy all current annotations label independent
    function RemoveAllAnnotations(event){
        if (event.type === "click"){
            let userResponse =  confirm('are you sure?');
            if (userResponse){
                destroyAllHandler();
                resetListsMentions();
            }
        }
    }

    // handler to send destroy all request
    function destroyAllHandler(){
        r.clearAnnotations().then(async function () {
            await sendData({destroyAll: true, destroyOne:false}, '/destroy_annotations');
        })
    }

    // listener for add span on hover
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

    // listener to open current list information
    function listHandler(event) {
        let span
        let target = event.target;
        if (event.type === "click"){
            if (((target.localName === "span") && (target.id === 'entityLabel')) || (target.localName === "i")){
                if(target.localName === "i"){
                    span = target.parentNode;
                }else{
                    span = target;
                }
                let label = span.className;
                let btnlist = document.getElementById("list-"+label);
                if (btnlist.style.display === "block"){
                    btnlist.style.display = "none";
                }else{
                    btnlist.style.display = "block";
                }
            }
        }
    }

    // return value of px info
    function getPxSize(el) {
        return el.match(/(\d+)px/)[1];
    }

    // listener to zoom in or zoom out
    function zoomText(event){
        let fontSizePre = textPre.getPropertyValue('font-size');
        let actualFS = parseFloat(getPxSize(fontSizePre));
        if(event.type === "click"){
            if (event.target.title === "zoom in" && actualFS !== 30){
                actualFS = actualFS + 5;
                textContent.style.fontSize = actualFS+"px";
            }
            else if (event.target.title === "zoom out" && actualFS > 10){
                actualFS = actualFS - 5;
                textContent.style.fontSize = actualFS+"px";
            }
        }
    }

    // Show or hide ul elements
    function displayUl(type){
        document.querySelectorAll('ul').forEach(function(ul){
            ul.style.display = type;
        });
    }

    // Query mentions in lists
    function queryMentions(event) {
        let i;
        let query = searchInput.value.toLowerCase().trim();
        let elements = document.querySelectorAll('ul > li');
        if (event.type === "focus"){
            displayUl('block');
        }
        else if (event.type === "keyup"){
            for (i = 0; i < elements.length; i ++) {
                let el = elements[i];
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
            for (i = 0; i < elements.length; i ++) {
                let el = elements[i];
                el.setAttribute('style', 'display: ""');
            }
            displayUl('none')
            searchInput.value = "";
        }
    }
})();