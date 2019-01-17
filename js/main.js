jQuery(document).ready(function ($) {

	var sliderContainers = $('.cd-slider-wrapper');

	if (sliderContainers.length > 0) initBlockSlider(sliderContainers);

	function initBlockSlider(sliderContainers) {
		sliderContainers.each(function () {
			var sliderContainer = $(this),
				slides = sliderContainer.children('.cd-slider').children('li'),
				sliderPagination = createSliderPagination(sliderContainer);

			sliderPagination.on('click', function (event) {
				event.preventDefault();
				var selected = $(this),
					index = selected.index();
				updateSlider(index, sliderPagination, slides);
			});

			sliderContainer.on('swipeleft', function () {
				var bool = enableSwipe(sliderContainer),
					visibleSlide = sliderContainer.find('.is-visible').last(),
					visibleSlideIndex = visibleSlide.index();
				if (!visibleSlide.is(':last-child') && bool) {
					updateSlider(visibleSlideIndex + 1, sliderPagination, slides);
				}
			});

			sliderContainer.on('swiperight', function () {
				var bool = enableSwipe(sliderContainer),
					visibleSlide = sliderContainer.find('.is-visible').last(),
					visibleSlideIndex = visibleSlide.index();
				if (!visibleSlide.is(':first-child') && bool) {
					updateSlider(visibleSlideIndex - 1, sliderPagination, slides);
				}
			});
		});
	}

	function createSliderPagination(container) {
		var wrapper = $('<ol class="cd-slider-navigation"></ol>');
		container.children('.cd-slider').find('li').each(function (index) {
			var dotWrapper = (index == 0) ? $('<li class="selected"></li>') : $('<li></li>'),
				dot = $('<a href="#0"></a>').appendTo(dotWrapper);
			dotWrapper.appendTo(wrapper);
			var dotText = (index + 1 < 10) ? '0' + (index + 1) : index + 1;
			dot.text(dotText);
		});
		wrapper.appendTo(container);
		return wrapper.children('li');
	}

	function updateSlider(n, navigation, slides) {
		navigation.removeClass('selected').eq(n).addClass('selected');
		slides.eq(n).addClass('is-visible').removeClass('covered').prevAll('li').addClass('is-visible covered').end().nextAll('li').removeClass('is-visible covered');

		//fixes a bug on Firefox with ul.cd-slider-navigation z-index
		navigation.parent('ul').addClass('slider-animating').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
			$(this).removeClass('slider-animating');
		});
	}

	function enableSwipe(container) {
		return (container.parents('.touch').length > 0);
	}




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
	jQuery(document).ready(function ($) {
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

jQuery(document).ready(function ($) {

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


/*				

Interesting story about this block of code, due to ajax loading on the page, specific page features like sliders aren't loaded.
As a failsafe, I decided to listen for the ajax node insertions and add them then.

*/

//document.addEventListener('')

var timedEvent;

document.addEventListener('wheel', eventCheck, false);
document.addEventListener('scroll', eventCheck, false);
document.addEventListener('click', eventCheck, false);
document.addEventListener('keyup', eventCheck, false);
document.addEventListener('mouseenter', eventCheck, false);
document.addEventListener('touchmove', eventCheck, false);
document.addEventListener('touchstart', eventCheck, false);
document.addEventListener('gotpointercapture', eventCheck, false);




function eventCheck() {
	clearTimeout(timedEvent);
	timedEvent = setTimeout(function () {
		// AJAX or Check for ads
		console.log("content updated")
		var sliderContainers = $('.cd-slider-wrapper');

		if (sliderContainers.length > 0) initBlockSlider(sliderContainers);

		function initBlockSlider(sliderContainers) {
			sliderContainers.each(function () {
				var sliderContainer = $(this),
					slides = sliderContainer.children('.cd-slider').children('li'),
					sliderPagination = createSliderPagination(sliderContainer);

				sliderPagination.on('click', function (event) {
					event.preventDefault();
					var selected = $(this),
						index = selected.index();
					updateSlider(index, sliderPagination, slides);
				});

				sliderContainer.on('swipeleft', function () {
					var bool = enableSwipe(sliderContainer),
						visibleSlide = sliderContainer.find('.is-visible').last(),
						visibleSlideIndex = visibleSlide.index();
					if (!visibleSlide.is(':last-child') && bool) {
						updateSlider(visibleSlideIndex + 1, sliderPagination, slides);
					}
				});

				sliderContainer.on('swiperight', function () {
					var bool = enableSwipe(sliderContainer),
						visibleSlide = sliderContainer.find('.is-visible').last(),
						visibleSlideIndex = visibleSlide.index();
					if (!visibleSlide.is(':first-child') && bool) {
						updateSlider(visibleSlideIndex - 1, sliderPagination, slides);
					}
				});
			});
		}

		function createSliderPagination(container) {
			var wrapper = $('<ol class="cd-slider-navigation"></ol>');
			container.children('.cd-slider').find('li').each(function (index) {
				var dotWrapper = (index == 0) ? $('<li class="selected"></li>') : $('<li></li>'),
					dot = $('<a href="#0"></a>').appendTo(dotWrapper);
				dotWrapper.appendTo(wrapper);
				var dotText = (index + 1 < 10) ? '0' + (index + 1) : index + 1;
				dot.text(dotText);
			});
			wrapper.appendTo(container);
			return wrapper.children('li');
		}

		function updateSlider(n, navigation, slides) {
			navigation.removeClass('selected').eq(n).addClass('selected');
			slides.eq(n).addClass('is-visible').removeClass('covered').prevAll('li').addClass('is-visible covered').end().nextAll('li').removeClass('is-visible covered');

			//fixes a bug on Firefox with ul.cd-slider-navigation z-index
			navigation.parent('ul').addClass('slider-animating').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
				$(this).removeClass('slider-animating');
			});
		}

		function enableSwipe(container) {
			return (container.parents('.touch').length > 0);
		}



		//detect the 'popstate' event - e.g. user clicking the back button


		//scroll to content if user clicks the .cd-scroll icon


		//start animation










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
	}, 100);
}