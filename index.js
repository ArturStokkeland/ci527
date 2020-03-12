window.addEventListener("load", function() {

    var pageNum = 1;
    var maxPageNum = 1;
    var resultsPerPage = 15;

    var searchForm = document.querySelector("#searchForm");

    //Keep track of the state (back button takes user to previous search)
    window.addEventListener("popstate", function (event) {

        if (event.state) {
            var textBox = document.querySelector("#mySearch");
            var inputText = decodeURIComponent(event.state.search);
            textBox.value = event.state.search.replace(/[+]/g, " ");
            searchDatabase();
        }

    });

    //Only way a new search happens, resets values and updates state
    searchForm.addEventListener("submit", function(event) {

        event.preventDefault();

        // Has no effect on search, is only used to push state
        var searchBox = document.querySelector("#mySearch");
        searchQuery = searchBox.value.trim();
        //Regex, removes multiple spaces in a row, and replaces all spaces with "+"
        searchQuery = searchQuery.replace(/ \ {0,}/g, "+");
        history.pushState({search: searchQuery}, null, "index.html");

        pageNum = 1; //reset current page number

        searchDatabase();

    });

    //Makes a search request
    function searchDatabase() {

        clearResults(); //clear previous results

        //creates search URL
        var searchBox = document.querySelector("#mySearch");
        searchQuery = searchBox.value.trim();
        //Regex, removes multiple spaces in a row, and replaces all spaces with "+"
        searchQuery = searchQuery.replace(/ \ {0,}/g, "+");
        searchQuery = "search?q=" + encodeURIComponent(searchQuery);

        if(document.querySelector("#imagesOnly").checked) {
            searchQuery += "&images=1"
        }

        if(document.querySelector("#descOnly").checked) {
            searchQuery += "&pad=1"
        }

        resultsPerPage = document.querySelector("#amtResults").value;
        if (resultsPerPage != 15) {
            searchQuery += "&limit=" + resultsPerPage;
        }

        if (pageNum != 1) {
            searchQuery += "&offset=" + pageNum * resultsPerPage;
        }
        document.querySelector("#curPage").innerHTML = pageNum;

        myURL = "https://www.vam.ac.uk/api/json/museumobject/" + searchQuery;

        //Requests data
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function() {

            if(xhr.status == 200) {

                var item = JSON.parse(xhr.responseText);
                maxPageNum = parseInt(item.meta.result_count / resultsPerPage);
                document.querySelector("#maxPage").innerHTML = maxPageNum;
                
                if (item.records.length == 0) {
                    document.querySelector("#searchFail").style.display = "block";
                }
                else {
                    item.records.forEach(function(myItem) {
                        document.querySelector("#navBar").style.display = "block";
                        createResultElement(myItem);
                    });
                }

                document.querySelector("#searchLoad").style.display = "none";

            }

        });
        //Show message if request failed
        xhr.addEventListener("error", function() {
            document.querySelector("#searchLoad").style.display = "none";
            document.querySelector("#searchError").style.display = "block";
        });

        xhr.open("GET", myURL, true);
        xhr.send();

    }

    //Creates elements to display according to json received from search
    function createResultElement(myItem) {

        var displayGrid = document.querySelector("#searchResult");

        var div = document.createElement("div");
        var header = document.createElement("h2");
        var image = document.createElement("img");
        image.setAttribute("src", "images/default.png");
        image.setAttribute("alt", "Default stock image");
        var artist = document.createElement("p");
        var date = document.createElement("p");

        header.innerHTML = "Title Unknown";
        if(myItem.fields.title) { header.innerHTML = myItem.fields.title; }
        div.appendChild(header);

        //Gives default image if anything goes wrong
        image.addEventListener("error", function() {
            image.setAttribute("src", "images/default.png");
            image.setAttribute("alt", "Default stock image");
        })
        var imageID = myItem.fields.primary_image_id;
        if (imageID)  {
            var imageURL = "https://media.vam.ac.uk/media/thira/collection_images/" + imageID.substring(0, 6) + "/" + imageID + ".jpg";
            image.setAttribute("src", imageURL);
            if (myItem.fields.title) { image.setAttribute("alt", myItem.fields.title); }
        }
        div.appendChild(image);

        artist.innerHTML = "Artist: Unknown";
        if (myItem.fields.artist) { artist.innerHTML = "Artist: " + myItem.fields.artist; }
        div.appendChild(artist);

        date.innerHTML = "Date: Unknown";
        if (myItem.fields.date_text) { date.innerHTML = "Date: " + myItem.fields.date_text; }
        div.appendChild(date);

        //Gives information to modal when instance is clicked
        div.addEventListener("click", function() {
            openDetails(myItem.fields.object_number);
        });

        displayGrid.appendChild(div);
        
    }

    //Clears the result grid to prepare for new results
    function clearResults() {

        document.querySelector("#navBar").style.display = "none";
        document.querySelector("#searchFail").style.display = "none";
        document.querySelector("#searchError").style.display = "none";
        document.querySelector("#searchLoad").style.display = "block";

        var displayGrid = document.querySelector("#searchResult");
        while (displayGrid.firstChild) {
            displayGrid.removeChild(displayGrid.firstChild);
        }

    }

    //Gets detailed information for a specific object and opens modal
    function openDetails(objectNumber) {

        var modal = document.querySelector("#modal");
        modal.style.display = "block";
        document.querySelector("#modalHeader").style.display = "none";
        document.querySelector("#modalBody").style.display = "none";
        document.querySelector("#modalError").style.display = "none";
        document.querySelector("#modalLoad").style.display = "block";
        myURL = "https://www.vam.ac.uk/api/json/museumobject/" + objectNumber;

        //Request detailed information
        var xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function() {

            if(xhr.status == 200) {

                var item = JSON.parse(xhr.responseText);
                dressModal(item[0].fields);
                document.querySelector("#modalLoad").style.display = "none";
                document.querySelector("#modalHeader").style.display = "block";
                document.querySelector("#modalBody").style.display = "grid";

            }

        });
        //Show message if request failed
        xhr.addEventListener("error", function() {
            document.querySelector("#modalLoad").style.display = "none";
            document.querySelector("#modalError").style.display = "block";
        });

        xhr.open("GET", myURL, true);
        xhr.send();

    }

    //Gives data to modal elements
    function dressModal(myItem) {
        var mainTitle = document.querySelector("#mainTitle");
        mainTitle.innerHTML = "Title Unknown";
        var modalImage = document.querySelector("#modalImage");
        modalImage.setAttribute("src", "images/default.png");
        modalImage.setAttribute("alt", "Default stock image");
        var subTitle = document.querySelector("#subTitle");
        subTitle.innerHTML = "Title: Unknown";
        var subArtist = document.querySelector("#subArtist");
        subArtist.innerHTML = "Artist: Unknown";
        var subDate = document.querySelector("#subDate");
        subDate.innerHTML = "Date: Unknown";
        var subLoc = document.querySelector("#subLoc");
        subLoc.innerHTML = "Location: Unknown";
        var subCountry = document.querySelector("#subCountry");
        subCountry.innerHTML = "Country: Unknown";
        var subDims = document.querySelector("#subDims");
        subDims.innerHTML = "Dimensions: Unknown";
        var subCateg = document.querySelector("#subCateg");
        subCateg.innerHTML = "Categories: Unknown";
        var subDesc = document.querySelector("#subDesc");
        subDesc.innerHTML = "Description: Unknown";

        if (myItem.image_set[0]) {
            var imageID = myItem.image_set[0].fields.image_id;
            var imageURL = "https://media.vam.ac.uk/media/thira/collection_images/" + imageID.substring(0, 6) + "/" + imageID + ".jpg";
            modalImage.setAttribute("src", imageURL);
            if (myItem.physical_description) { modalImage.setAttribute("alt", myItem.physical_description); }
        }

        if (myItem.title) {
            mainTitle.innerHTML = myItem.title;
            subTitle.innerHTML = "Title: " + myItem.title;
        }
        if (myItem.artist) { subArtist.innerHTML = "Artist: " + myItem.artist; }
        if (myItem.date_text) { subDate.innerHTML = "Date: " + myItem.date_text; }
        if (myItem.location) { subLoc.innerHTML = "Location: " + myItem.location; }
        if (myItem.place) { subCountry.innerHTML = "Country: " + myItem.place; }
        if (myItem.dimensions) { subDims.innerHTML = "Dimensions: " + myItem.dimensions; }
        if (myItem.place) { subCountry.innerHTML = "Country: " + myItem.place; }
        if (myItem.public_access_description) { subDesc.innerHTML = "Description: " + myItem.public_access_description; }
        if (myItem.categories[0]) {
            var catString = "Categories: ";
            for (var i = 0; i < myItem.categories.length; i++) {
                catString += myItem.categories[i].fields.name;
                if (i < myItem.categories.length - 1) { catString += ", "; }
            }
            subCateg.innerHTML = catString;
        }
        
    }

    //Sets default image if errors occur
    document.querySelector("#modalImage").addEventListener("error", function() {
        this.setAttribute("src", "images/default.png");
        this.setAttribute("alt", "Default stock image");
    });

    //Closes modal if user clicks outside of the modal
    window.addEventListener("click", function(event) {

        var modal = document.querySelector("#modal");
        if (event.target == modal) {
            modal.style.display = "none";
        }

    })

    //Closes modal if user clicks "X" in top right corner
    var modalClose = document.querySelector("#close")
    modalClose.addEventListener("click", function() {
        var modal = document.querySelector("#modal");
        modal.style.display = "none";
    });

    //Logic for going back a page
    document.querySelector("#prevPage").addEventListener("click", function() {
        if (pageNum > 1) {
            pageNum--;
            searchDatabase();
        }
    });

    //Logic for going to the next page
    document.querySelector("#nextPage").addEventListener("click", function() {
        if (pageNum < maxPageNum) {
            pageNum++;
            searchDatabase();
        }
    });

    //Goes to the page which the user input
    document.querySelector("#pageNavForm").addEventListener("submit", function(event) {
        event.preventDefault();

        //Gets and clamps the value before requesting new search
        var gotoNum = document.querySelector("#pageNum").value;
        gotoNum = Math.max(1, Math.min(gotoNum, maxPageNum))
        pageNum = parseInt(gotoNum);
        searchDatabase();
    });

});
