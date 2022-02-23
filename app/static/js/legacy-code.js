
/* ~ Legacy code ~



const showAnnotations = async () => {
        var divTarget = document.getElementById("number-annotations")

        const mapping = await fetchMapping;
        for (var key in mapping){
            var span = document.createElement('span');
            var spanCount = document.createElement('span');
            var br = document.createElement('br');
            var br2 = document.createElement('br');
            span.textContent = key;
            span.className = key;
            span.id = "counterEntity"
            divTarget.appendChild(span);
            divTarget.appendChild(br);
            divTarget.appendChild(br2);

        }

    };


    showAnnotations();


// utils functions
    function FindByAttributeValue(attribute, value, element_type)    {
        element_type = element_type || "*";
        var All = document.getElementsByTagName(element_type);
        for (var i = 0; i < All.length; i++)       {
            if (All[i].getAttribute(attribute) == value) { return All[i]; }
        }
    }

    function getAnnotationID(annotation){
        return annotation.id
    }


function addSpanLabel(annotation){
    var currentLabel = annotation.body[0].value;
    var currentID    = getAnnotationID(annotation);
    var currentSpan  = FindByAttributeValue('data-id', currentID, "span");
    var newSpanLabel = document.createElement('span');
    newSpanLabel.textContent = currentLabel;
    newSpanLabel.className = "entityDescriptor";
    newSpanLabel.id = currentID;
    currentSpan.appendChild(newSpanLabel);
    return newSpanLabel.innerHTML.length
}

function removeSpanLabel(annotation_id){
    var currentSpan = document.getElementById(annotation_id);
    currentSpan.remove();
}


        var container = document.createElement('div');
        container.className = 'colorselector-widget';



        for (var key in mapping){
            console.log(key)
            var button = createButton(key);
            console.log(container)
            container.appendChild(button);
        }


        for (const [label, color] of Object.entries(mapping)) {
            var button = createButton(label);
            container.appendChild(button);
        }


*/

   // event listner to search mentions

    /*
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
        var query = document.getElementById('myInput').value;
        console.log(event.target);
        var elements = document.querySelectorAll('ul > li');

        if (event.type === "focus"){
            displayUl('');
        }
        // search
        else if (event.type === "keyup"){
            for (var i = 0; i < elements.length; i ++) {
                var el = elements[i];
                if (el.innerText.indexOf(query) > -1){
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

        }
        //else{

        //    for (var i = 0; i < elements.length; i ++) {
        //        var el = elements[i];
        //        el.setAttribute('style', 'display: ""');
        //    }
            //document.querySelectorAll('ul').forEach(function(ul, index){
            //ul.style.display = "none"
        //})
        // }
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

    }*/
