jQuery(document).ready(function(){
	var intro = $('.cd-intro-block'),
		projectsContainer = $('.cd-projects-wrapper'),
		projectsprojslider = projectsContainer.children('.cd-projslider'),
		singleProjectContent = $('.cd-project-content'),
		projsliderNav = $('.cd-projslider-navigation');

	var resizing = false;
	
	//if on desktop - set a width for the projectsprojslider element
	setprojsliderContainer();
	$(window).on('resize', function(){
		//on resize - update projectsprojslider width and translate value
		if( !resizing ) {
			(!window.requestAnimationFrame) ? setprojsliderContainer() : window.requestAnimationFrame(setprojsliderContainer);
			resizing = true;
		}
	});

	//show the projects projslider if user clicks the show-projects button
	intro.on('click', 'a[data-action="show-projects"]', function(event) {
		event.preventDefault();
		intro.addClass('projects-visible');
		projectsContainer.addClass('projects-visible');
		//animate single project - entrance animation
		setTimeout(function(){
			showProjectPreview(projectsprojslider.children('li').eq(0));
		}, 200);
	});

	intro.on('click', function(event) {
		//projects projslider is visible - hide projslider and show the intro panel
		if( intro.hasClass('projects-visible') && !$(event.target).is('a[data-action="show-projects"]') ) {
			intro.removeClass('projects-visible');
			projectsContainer.removeClass('projects-visible');
		}
	});

	//select a single project - open project-content panel
	projectsContainer.on('click', '.cd-projslider a', function(event) {
		var mq = checkMQ();
		event.preventDefault();
		if( $(this).parent('li').next('li').is('.current') && (mq == 'desktop') ) {
			prevSides(projectsprojslider);
		} else if ( $(this).parent('li').prev('li').prev('li').prev('li').is('.current')  && (mq == 'desktop') ) {
			nextSides(projectsprojslider);
		} else {
			singleProjectContent.addClass('is-visible');
		}
	});

	//close single project content
	singleProjectContent.on('click', '.close', function(event){
		event.preventDefault();
		singleProjectContent.removeClass('is-visible');
	});

	//go to next/pre slide - clicking on the next/prev arrow
	projsliderNav.on('click', '.next', function(){
		nextSides(projectsprojslider);
	});
	projsliderNav.on('click', '.prev', function(){
		prevSides(projectsprojslider);
	});

	//go to next/pre slide - keyboard navigation
	$(document).keyup(function(event){
		var mq = checkMQ();
		if(event.which=='37' &&  intro.hasClass('projects-visible') && !(projsliderNav.find('.prev').hasClass('inactive')) && (mq == 'desktop') ) {
			prevSides(projectsprojslider);
		} else if( event.which=='39' &&  intro.hasClass('projects-visible') && !(projsliderNav.find('.next').hasClass('inactive')) && (mq == 'desktop') ) {
			nextSides(projectsprojslider);
		} else if(event.which=='27' && singleProjectContent.hasClass('is-visible')) {
			singleProjectContent.removeClass('is-visible');
		}
	});

	projectsprojslider.on('swipeleft', function(){
		var mq = checkMQ();
		if( !(projsliderNav.find('.next').hasClass('inactive')) && (mq == 'desktop') ) nextSides(projectsprojslider);
	});

	projectsprojslider.on('swiperight', function(){
		var mq = checkMQ();
		if ( !(projsliderNav.find('.prev').hasClass('inactive')) && (mq == 'desktop') ) prevSides(projectsprojslider);
	});

	function showProjectPreview(project) {
		if(project.length > 0 ) {
			setTimeout(function(){
				project.addClass('slides-in');
				showProjectPreview(project.next());
			}, 50);
		}
	}

	function checkMQ() {
		//check if mobile or desktop device
		return window.getComputedStyle(document.querySelector('.cd-projects-wrapper'), '::before').getPropertyValue('content').replace(/'/g, "").replace(/"/g, "");
	}

	function setprojsliderContainer() {
		var mq = checkMQ();
		if(mq == 'desktop') {
			var	slides = projectsprojslider.children('li'),
				slideWidth = slides.eq(0).width(),
				marginLeft = Number(projectsprojslider.children('li').eq(1).css('margin-left').replace('px', '')),
				projsliderWidth = ( slideWidth + marginLeft )*( slides.length + 1 ) + 'px',
				slideCurrentIndex = projectsprojslider.children('li.current').index();
			projectsprojslider.css('width', projsliderWidth);
			( slideCurrentIndex != 0 ) && setTranslateValue(projectsprojslider, (  slideCurrentIndex * (slideWidth + marginLeft) + 'px'));
		} else {
			projectsprojslider.css('width', '');
			setTranslateValue(projectsprojslider, 0);
		}
		resizing = false;
	}

	function nextSides(projslider) {
		var actual = projslider.children('.current'),
			index = actual.index(),
			following = actual.nextAll('li').length,
			width = actual.width(),
			marginLeft = Number(projslider.children('li').eq(1).css('margin-left').replace('px', ''));

		index = (following > 4 ) ? index + 3 : index + following - 2;
		//calculate the translate value of the projslider container
		translate = index * (width + marginLeft) + 'px';

		projslider.addClass('next');
		setTranslateValue(projslider, translate);
		projslider.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
			updateprojslider('next', actual, projslider, following);
		});

		if( $('.no-csstransitions').length > 0 ) updateprojslider('next', actual, projslider, following);
	}

	function prevSides(projslider) {
		var actual = projslider.children('.previous'),
			index = actual.index(),
			width = actual.width(),
			marginLeft = Number(projslider.children('li').eq(1).css('margin-left').replace('px', ''));

		translate = index * (width + marginLeft) + 'px';

		projslider.addClass('prev');
		setTranslateValue(projslider, translate);
		projslider.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
			updateprojslider('prev', actual, projslider);
		});

		if( $('.no-csstransitions').length > 0 ) updateprojslider('prev', actual, projslider);
	}

	function updateprojslider(direction, actual, projslider, numerFollowing) {
		if( direction == 'next' ) {
			
			projslider.removeClass('next').find('.previous').removeClass('previous');
			actual.removeClass('current');
			if( numerFollowing > 4 ) {
				actual.addClass('previous').next('li').next('li').next('li').addClass('current');
			} else if ( numerFollowing == 4 ) {
				actual.next('li').next('li').addClass('current').prev('li').prev('li').addClass('previous');
			} else {
				actual.next('li').addClass('current').end().addClass('previous');
			}
		} else {
			
			projslider.removeClass('prev').find('.current').removeClass('current');
			actual.removeClass('previous').addClass('current');
			if(actual.prevAll('li').length > 2 ) {
				actual.prev('li').prev('li').prev('li').addClass('previous');
			} else {
				( !projslider.children('li').eq(0).hasClass('current') ) && projslider.children('li').eq(0).addClass('previous');
			}
		}
		
		updateNavigation();
	}

	function updateNavigation() {
		//update visibility of next/prev buttons according to the visible slides
		var current = projectsContainer.find('li.current');
		(current.is(':first-child')) ? projsliderNav.find('.prev').addClass('inactive') : projsliderNav.find('.prev').removeClass('inactive');
		(current.nextAll('li').length < 3 ) ? projsliderNav.find('.next').addClass('inactive') : projsliderNav.find('.next').removeClass('inactive');
	}

	function setTranslateValue(item, translate) {
		item.css({
		    '-moz-transform': 'translateX(-' + translate + ')',
		    '-webkit-transform': 'translateX(-' + translate + ')',
			'-ms-transform': 'translateX(-' + translate + ')',
			'-o-transform': 'translateX(-' + translate + ')',
			'transform': 'translateX(-' + translate + ')',
		});
	}
});