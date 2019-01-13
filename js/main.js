$(window).load(function () {
	//set some variables
	var isAnimating = false,
		firstLoad = false,
		newScaleValue = 1;

	//cache DOM elements
	var dashboard = $('.cd-side-navigation'),
		mainContent = $('.cd-main'),
		loadingBar = $('#cd-loading-bar');

	//select a new section
	dashboard.on('click', 'a', function (event) {
		event.preventDefault();
		var target = $(this),
			//detect which section user has chosen
			sectionTarget = target.data('menu');
		if (!target.hasClass('selected') && !isAnimating) {
			//if user has selected a section different from the one alredy visible - load the new content
			triggerAnimation(sectionTarget, true);
		}

		firstLoad = true;
	});

	//detect the 'popstate' event - e.g. user clicking the back button
	$(window).on('popstate', function () {
		if (firstLoad) {
			/*
			Safari emits a popstate event on page load - check if firstLoad is true before animating
			if it's false - the page has just been loaded 
			*/
			var newPageArray = location.pathname.split('/'),
				//this is the url of the page to be loaded 
				newPage = newPageArray[newPageArray.length - 1].replace('.html', '');
			if (!isAnimating) triggerAnimation(newPage, false);
		}
		firstLoad = true;
	});

	//scroll to content if user clicks the .cd-scroll icon
	mainContent.on('click', '.cd-scroll', function (event) {
		event.preventDefault();
		var scrollId = $(this.hash);
		$(scrollId).velocity('scroll', {
			container: $(".cd-section")
		}, 200);
	});

	//start animation
	function triggerAnimation(newSection, bool) {
		isAnimating = true;
		newSection = (newSection == '') ? 'index' : newSection;

		//update dashboard
		dashboard.find('*[data-menu="' + newSection + '"]').addClass('selected').parent('li').siblings('li').children('.selected').removeClass('selected');
		//trigger loading bar animation
		initializeLoadingBar(newSection);
		//load new content
		loadNewContent(newSection, bool);
	}

	function initializeLoadingBar(section) {
		var selectedItem = dashboard.find('.selected'),
			barHeight = selectedItem.outerHeight(),
			barTop = selectedItem.offset().top,
			windowHeight = $(window).height(),
			maxOffset = (barTop + barHeight / 2 > windowHeight / 2) ? barTop : windowHeight - barTop - barHeight,
			scaleValue = ((2 * maxOffset + barHeight) / barHeight).toFixed(3) / 1 + 0.001;

		//place the loading bar next to the selected dashboard element
		loadingBar.data('scale', scaleValue).css({
			height: barHeight,
			top: barTop
		}).attr('class', '').addClass('loading ' + section);
	}

	function loadNewContent(newSection, bool) {
		setTimeout(function () {
			//animate loading bar
			loadingBarAnimation();

			//create a new section element and insert it into the DOM
			var section = $('<section class="cd-section overflow-hidden ' + newSection + '"></section>').appendTo(mainContent);
			//load the new content from the proper html file
			section.load(newSection + '.html .cd-section > *', function (event) {
				//finish up the animation and then make the new section visible
				var scaleMax = loadingBar.data('scale');

				loadingBar.velocity('stop').velocity({
					scaleY: scaleMax
				}, 400, function () {
					//add the .visible class to the new section element -> it will cover the old one
					section.prev('.visible').removeClass('visible').end().addClass('visible').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
						resetAfterAnimation(section);
					});

					//if browser doesn't support transition
					if ($('.no-csstransitions').length > 0) {
						resetAfterAnimation(section);
					}

					var url = newSection + '.html';

					if (url != window.location && bool) {
						//add the new page to the window.history
						//if the new page was triggered by a 'popstate' event, don't add it
						window.history.pushState({
							path: url
						}, '', url);
					}
				});
			});

		}, 50);
	}

	function loadingBarAnimation() {
		var scaleMax = loadingBar.data('scale');
		if (newScaleValue + 1 < scaleMax) {
			newScaleValue = newScaleValue + 1;
		} else if (newScaleValue + 0.5 < scaleMax) {
			newScaleValue = newScaleValue + 0.5;
		}

		loadingBar.velocity({
			scaleY: newScaleValue
		}, 100, loadingBarAnimation);
	}

	function resetAfterAnimation(newSection) {
		//once the new section animation is over, remove the old section and make the new one scrollable
		newSection.removeClass('overflow-hidden').prev('.cd-section').remove();
		isAnimating = false;
		//reset your loading bar
		resetLoadingBar();
	}

	function resetLoadingBar() {
		loadingBar.removeClass('loading').velocity({
			scaleY: 1
		}, 1);
	}




	function VerticalTimeline(element) {
		this.element = element;
		this.blocks = this.element.getElementsByClassName("js-cd-block");
		this.images = this.element.getElementsByClassName("js-cd-img");
		this.contents = this.element.getElementsByClassName("js-cd-content");
		this.offset = 0.8;
		this.hideBlocks();
	};

	VerticalTimeline.prototype.hideBlocks = function () {
		//hide timeline blocks which are outside the viewport
		if (!"classList" in document.documentElement) {
			return;
		}
		var self = this;
		for (var i = 0; i < this.blocks.length; i++) {
			(function (i) {
				if (self.blocks[i].getBoundingClientRect().top > window.innerHeight * self.offset) {
					self.images[i].classList.add("cd-is-hidden");
					self.contents[i].classList.add("cd-is-hidden");
				}
			})(i);
		}
	};

	VerticalTimeline.prototype.showBlocks = function () {
		if (!"classList" in document.documentElement) {
			return;
		}
		var self = this;
		for (var i = 0; i < this.blocks.length; i++) {
			(function (i) {
				if (self.contents[i].classList.contains("cd-is-hidden") && self.blocks[i].getBoundingClientRect().top <= window.innerHeight * self.offset) {
					// add bounce-in animation
					self.images[i].classList.add("cd-timeline__img--bounce-in");
					self.contents[i].classList.add("cd-timeline__content--bounce-in");
					self.images[i].classList.remove("cd-is-hidden");
					self.contents[i].classList.remove("cd-is-hidden");
				}
			})(i);
		}
	};

	var verticalTimelines = document.getElementsByClassName("js-cd-timeline"),
		verticalTimelinesArray = [],
		scrolling = false;
	if (verticalTimelines.length > 0) {
		for (var i = 0; i < verticalTimelines.length; i++) {
			(function (i) {
				verticalTimelinesArray.push(new VerticalTimeline(verticalTimelines[i]));
			})(i);
		}

		//show timeline blocks on scrolling
		window.addEventListener("scroll", function (event) {
			if (!scrolling) {
				scrolling = true;
				(!window.requestAnimationFrame) ? setTimeout(checkTimelineScroll, 250): window.requestAnimationFrame(checkTimelineScroll);
			}
		});
	}

	function checkTimelineScroll() {
		verticalTimelinesArray.forEach(function (timeline) {
			timeline.showBlocks();
		});
		scrolling = false;
	};


	$('.cd-testimonials-wrapper').flexslider({
		selector: ".cd-testimonials > li",
		animation: "slide",
		controlNav: false,
		slideshow: true,
		slideshowSpeed: 35000,
		smoothHeight: true,
		start: (function () {
			$('.cd-testimonials').children('li').css({
				'opacity': 1,
				'position': 'relative'
			});
		})()
	});



});


$(window).load(function () {

	$(document).ready(function () {
		//set some variables
		var isAnimating = false,
			firstLoad = false,
			newScaleValue = 1;

		//cache DOM elements
		var dashboard = $('.cd-side-navigation'),
			mainContent = $('.cd-main'),
			loadingBar = $('#cd-loading-bar');

		//select a new section
		dashboard.on('click', 'a', function (event) {
			event.preventDefault();
			var target = $(this),
				//detect which section user has chosen
				sectionTarget = target.data('menu');
			if (!target.hasClass('selected') && !isAnimating) {
				//if user has selected a section different from the one alredy visible - load the new content
				triggerAnimation(sectionTarget, true);
			}

			firstLoad = true;
		});

		//detect the 'popstate' event - e.g. user clicking the back button
		$(window).on('popstate', function () {
			if (firstLoad) {
				/*
				Safari emits a popstate event on page load - check if firstLoad is true before animating
				if it's false - the page has just been loaded 
				*/
				var newPageArray = location.pathname.split('/'),
					//this is the url of the page to be loaded 
					newPage = newPageArray[newPageArray.length - 1].replace('.html', '');
				if (!isAnimating) triggerAnimation(newPage, false);
			}
			firstLoad = true;
		});

		//scroll to content if user clicks the .cd-scroll icon
		mainContent.on('click', '.cd-scroll', function (event) {
			event.preventDefault();
			var scrollId = $(this.hash);
			$(scrollId).velocity('scroll', {
				container: $(".cd-section")
			}, 200);
		});

		//start animation
		function triggerAnimation(newSection, bool) {
			isAnimating = true;
			newSection = (newSection == '') ? 'index' : newSection;

			//update dashboard
			dashboard.find('*[data-menu="' + newSection + '"]').addClass('selected').parent('li').siblings('li').children('.selected').removeClass('selected');
			//trigger loading bar animation
			initializeLoadingBar(newSection);
			//load new content
			loadNewContent(newSection, bool);
		}

		function initializeLoadingBar(section) {
			var selectedItem = dashboard.find('.selected'),
				barHeight = selectedItem.outerHeight(),
				barTop = selectedItem.offset().top,
				windowHeight = $(window).height(),
				maxOffset = (barTop + barHeight / 2 > windowHeight / 2) ? barTop : windowHeight - barTop - barHeight,
				scaleValue = ((2 * maxOffset + barHeight) / barHeight).toFixed(3) / 1 + 0.001;

			//place the loading bar next to the selected dashboard element
			loadingBar.data('scale', scaleValue).css({
				height: barHeight,
				top: barTop
			}).attr('class', '').addClass('loading ' + section);
		}

		function loadNewContent(newSection, bool) {
			setTimeout(function () {
				//animate loading bar
				loadingBarAnimation();

				//create a new section element and insert it into the DOM
				var section = $('<section class="cd-section overflow-hidden ' + newSection + '"></section>').appendTo(mainContent);
				//load the new content from the proper html file
				section.load(newSection + '.html .cd-section > *', function (event) {
					//finish up the animation and then make the new section visible
					var scaleMax = loadingBar.data('scale');

					loadingBar.velocity('stop').velocity({
						scaleY: scaleMax
					}, 400, function () {
						//add the .visible class to the new section element -> it will cover the old one
						section.prev('.visible').removeClass('visible').end().addClass('visible').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
							resetAfterAnimation(section);
						});

						//if browser doesn't support transition
						if ($('.no-csstransitions').length > 0) {
							resetAfterAnimation(section);
						}

						var url = newSection + '.html';

						if (url != window.location && bool) {
							//add the new page to the window.history
							//if the new page was triggered by a 'popstate' event, don't add it
							window.history.pushState({
								path: url
							}, '', url);
						}
					});
				});

			}, 50);
		}

		function loadingBarAnimation() {
			var scaleMax = loadingBar.data('scale');
			if (newScaleValue + 1 < scaleMax) {
				newScaleValue = newScaleValue + 1;
			} else if (newScaleValue + 0.5 < scaleMax) {
				newScaleValue = newScaleValue + 0.5;
			}

			loadingBar.velocity({
				scaleY: newScaleValue
			}, 100, loadingBarAnimation);
		}

		function resetAfterAnimation(newSection) {
			//once the new section animation is over, remove the old section and make the new one scrollable
			newSection.removeClass('overflow-hidden').prev('.cd-section').remove();
			isAnimating = false;
			//reset your loading bar
			resetLoadingBar();
		}

		function resetLoadingBar() {
			loadingBar.removeClass('loading').velocity({
				scaleY: 1
			}, 1);
		}




		function VerticalTimeline(element) {
			this.element = element;
			this.blocks = this.element.getElementsByClassName("js-cd-block");
			this.images = this.element.getElementsByClassName("js-cd-img");
			this.contents = this.element.getElementsByClassName("js-cd-content");
			this.offset = 0.8;
			this.hideBlocks();
		};

		VerticalTimeline.prototype.hideBlocks = function () {
			//hide timeline blocks which are outside the viewport
			if (!"classList" in document.documentElement) {
				return;
			}
			var self = this;
			for (var i = 0; i < this.blocks.length; i++) {
				(function (i) {
					if (self.blocks[i].getBoundingClientRect().top > window.innerHeight * self.offset) {
						self.images[i].classList.add("cd-is-hidden");
						self.contents[i].classList.add("cd-is-hidden");
					}
				})(i);
			}
		};

		VerticalTimeline.prototype.showBlocks = function () {
			if (!"classList" in document.documentElement) {
				return;
			}
			var self = this;
			for (var i = 0; i < this.blocks.length; i++) {
				(function (i) {
					if (self.contents[i].classList.contains("cd-is-hidden") && self.blocks[i].getBoundingClientRect().top <= window.innerHeight * self.offset) {
						// add bounce-in animation
						self.images[i].classList.add("cd-timeline__img--bounce-in");
						self.contents[i].classList.add("cd-timeline__content--bounce-in");
						self.images[i].classList.remove("cd-is-hidden");
						self.contents[i].classList.remove("cd-is-hidden");
					}
				})(i);
			}
		};

		var verticalTimelines = document.getElementsByClassName("js-cd-timeline"),
			verticalTimelinesArray = [],
			scrolling = false;
		if (verticalTimelines.length > 0) {
			for (var i = 0; i < verticalTimelines.length; i++) {
				(function (i) {
					verticalTimelinesArray.push(new VerticalTimeline(verticalTimelines[i]));
				})(i);
			}

			//show timeline blocks on scrolling
			window.addEventListener("scroll", function (event) {
				if (!scrolling) {
					scrolling = true;
					(!window.requestAnimationFrame) ? setTimeout(checkTimelineScroll, 250): window.requestAnimationFrame(checkTimelineScroll);
				}
			});
		}

		function checkTimelineScroll() {
			verticalTimelinesArray.forEach(function (timeline) {
				timeline.showBlocks();
			});
			scrolling = false;
		};



		$('.cd-testimonials-wrapper').flexslider({
			selector: ".cd-testimonials > li",
			animation: "slide",
			controlNav: false,
			slideshow: true,
			slideshowSpeed: 35000,
			smoothHeight: true,
			start: (function () {
				$('.cd-testimonials').children('li').css({
					'opacity': 1,
					'position': 'relative'
				});
			})()
		});



	});


});




//create the slider



//close the testimonials modal page


//build the grid for the testimonials modal page