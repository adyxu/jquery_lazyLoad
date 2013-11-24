/*!
 * Lazy Load - jQuery plugin for lazy loading images
 *
 * see https://github.com/jieyou/jquery_lazyload
 *
 * Forked form 
 *    "Copyright (c) 2007-2013 Mika Tuupola
 *
 *    Licensed under the MIT license:
 *    http://www.opensource.org/licenses/mit-license.php
 *
 *    Project home:
 *    http://www.appelsiini.net/projects/lazyload"
 *
 * and modified.
 */
;(function($,window,document,undefined){
    var $window = $(window),
        defaultOptions = {
            threshold          : 0,
            failure_limit      : 0,
            event              : 'scroll',
            effect             : 'show',
            effect_params      : null,
            container          : window,
            data_attribute     : 'original',
            skip_invisible     : true,
            appear             : null,
            load               : null,
            vertical_only      : false,
            placeholderDataImg : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC',
            // Support IE6\7 that does not support data image
            placeholderRealImg : 'http://webmap4.map.bdimg.com/yyfm/lazyload/0.0.1/img/placeholder.png'
        },
        isIOS5 = (/(?:iphone|ipod|ipad).*os 5/gi).test(navigator.appVersion)

    function belowthefold(element, options){
        var fold
        if(options.container === undefined || options.container === window){
            fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop()
        }else{
            fold = $(options.container).offset().top + $(options.container).height()
        }
        return fold <= $(element).offset().top - options.threshold
    }

    function rightoffold(element, options){
        var fold
        if(options.container === undefined || options.container === window){
            fold = $window.width() + $window.scrollLeft()
        }else{
            fold = $(options.container).offset().left + $(options.container).width()
        }
        return fold <= $(element).offset().left - options.threshold
    }

    function abovethetop(element, options){
        var fold
        if(options.container === undefined || options.container === window){
            fold = $window.scrollTop()
        }else{
            fold = $(options.container).offset().top
        }
        return fold >= $(element).offset().top + options.threshold  + $(element).height()
    }

    function leftofbegin(element, options){
        var fold
        if(options.container === undefined || options.container === window){
            fold = $window.scrollLeft()
        }else{
            fold = $(options.container).offset().left
        }
        return fold >= $(element).offset().left + options.threshold + $(element).width()
    }

    function checkAppear(elements, options){
        var counter = 0
        elements.each(function(){
            var $this = $(this)
            if(options.skip_invisible &&
            // Support zepto for future
             !($this.width() || $this.height()) && $this.css("display") !== "none"){
                return
            }
            function appear(){
                $this.trigger('_lazyload_appear')
                // if we found an image we'll load, reset the counter 
                counter = 0
            }
            // If vertical_only is set to true, only check the vertical to decide appear or not
            // In most situations, page can only scroll vertically, set vertical_only to true will improve performance
            if(options.vertical_only){
                if(abovethetop(this, options)){
                    // Nothing. 
                }else if(!belowthefold(this, options)){
                    appear()
                }else{
                    if(++counter > options.failure_limit){
                        return false
                    }
                }
            }else{
                if(abovethetop(this, options) || leftofbegin(this, options)){
                    // Nothing. 
                }else if(!belowthefold(this, options) && !rightoffold(this, options)){
                    appear()
                }else{
                    if(++counter > options.failure_limit){
                        return false
                    }
                }
            }
        })
    }

    // Remove image from array so it is not looped next time. 
    function getUnloadElements(elements){
        var temp = $.grep(elements, function(element){
            return !element._lazyload_loadStarted
        })
        return $(temp)
    }

    $.fn.lazyload = function(options){
        var elements = this,
            $container,
            isScrollTypeEvent

        if(!$.isPlainObject(options)){
            options = {}
        }
        $.each(defaultOptions,function(k,v){
            if(defaultOptions.hasOwnProperty(k) && (!options.hasOwnProperty(k) || (typeof(options[k]) != typeof(defaultOptions[k])))){
                options[k] = v
            }
        })

        // Cache container as jQuery as object. 
        $container = (options.container === undefined || options.container === window) ? $window : $(options.container)

        // isScrollTypeEvent or not 
        isScrollTypeEvent = options.event == 'scroll' || options.event == 'scrollstart' || options.event == 'scrollstop'

        elements.each(function(){
            var element = this,
                $element = $(element),
                placeholderSrc = $element.attr('src'),
                originalSrc = $element.attr('data-'+options.data_attribute),
                isImg = $element.is('img')

            if(element._lazyload_loadStarted == true || placeholderSrc == originalSrc){
                element._lazyload_loadStarted = true
                elements = getUnloadElements(elements)
                return
            }

            element._lazyload_loadStarted = false

            // If element is an img and no src attribute given, use placeholder. 
            if(isImg && !placeholderSrc){
                // For browsers that do not support data image.
                $element.on('error',function(){
                    $element.attr('src',options.placeholderRealImg)
                }).attr('src',options.placeholderDataImg)
            }
            
            // When appear is triggered load original image. 
            $element.one('_lazyload_appear',function(){
                var elements_left,
                    effectParamsIsArray = $.isArray(options.effect_params),
                    effectIsNotImmediacyShow
                if(!element._lazyload_loadStarted){
                    effectIsNotImmediacyShow = (options.effect != 'show' && (!options.effect_params || (effectParamsIsArray && options.effect_params.length == 0)))
                    if(options.appear){
                        elements_left = elements.length
                        options.appear.call(element, elements_left, options)
                    }
                    element._lazyload_loadStarted = true
                    $('<img />').on('load', function(){
                        var elements_left
                        // In most situations, the effect is immediacy show, at this time there is no need to hide element first
                        // Hide this element may cause css reflow, call it as less as possible
                        if(effectIsNotImmediacyShow){
                            $element.hide()
                        }
                        if(isImg){
                            $element.attr('src', originalSrc)
                        }else{
                            $element.css('background-image','url("' + originalSrc + '")')
                        }
                        if(effectIsNotImmediacyShow && effectParamsIsArray){
                            $element[options.effect].apply($element,options.effect_params)
                        }
                        elements = getUnloadElements(elements)
                        if(options.load){
                            elements_left = elements.length
                            options.load.call(element, elements_left, options)
                        }
                    }).attr('src',originalSrc)
                }
            })

            // When wanted event is triggered load original image 
            // by triggering appear.                              
            if (!isScrollTypeEvent){
                $element.on(options.event, function(){
                    if (!element._lazyload_loadStarted){
                        $element.trigger('_lazyload_appear')
                    }
                })
            }
        })
    
        // Fire one scroll event per scroll. Not one scroll event per image. 
        if(isScrollTypeEvent){
            $container.on(options.event, function(){
                return checkAppear(elements, options)
            })
        }

        // Check if something appears when window is resized. 
        $window.on('resize', function(){
            checkAppear(elements, options)
        })
              
        // With IOS5 force loading images when navigating with back button. 
        // Non optimal workaround. 
        if(isIOS5){
            $window.on('pageshow', function(event){
                if (event.originalEvent && event.originalEvent.persisted){
                    elements.trigger('_lazyload_appear')
                }
            })
        }

        // Force initial check if images should appear. 
        $(function(){
            checkAppear(elements, options)
        })
        
        return this
    }

})(jQuery, window, document)
