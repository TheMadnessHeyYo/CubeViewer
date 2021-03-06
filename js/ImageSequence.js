// ====================================================================================================
// ImageSequence
// ====================================================================================================
// Cruz - 03/03/2012
//
// This functionality was started by Shaun and Brad I think. I turned it into a class.
//
// ====================================================================================================

	// ====================================================================================================
	// ImageSequenceData
	// Type: Object
	//
	// The parameter object for a this.
	//
	// ====================================================================================================
	function ImageSequenceData()
	{
		// The images to load
		this._imagePaths		= [];

		// The view pane size.
		this._dimensions		= { '_x': 0, '_y': 0,	'_width': 480, '_height': 320 };
		
//		this._threshold			= 20;
		
		this._initialFrame		= 0;
	}
	
	
	
	// ====================================================================================================
	// ImageSequence
	// Type: Object
	//
	//	Parameters:
	//
	//		pImageSequenceData:		Used to initialize.
	//
	// ====================================================================================================
	function ImageSequence (pImageSequenceData)
	{
		// ----------
		// PROPERTIES
		// ----------
		this._imageSequenceData 		= null;
		
		this._step						= 0;

		this._prevDelta					= 0;
		this._curDelta					= 0;
		
		this._maxFrame					= 0;

		this._usesTouchEvents			= false;
		
		this._parentPopUpWithHotSpot	= null;		// The parent popup with hotspot that contains this content.
		
		this._prevDirection				= 0;		// -1 = left, 0 = still, 1 = right
		
		this._jContainer				= null;		// ...the container for this component.
		this._jSequence					= null;
		this._jButton					= null;
		
		this._jImages					= [];		// ... the array of images for this component.
		
		
		
		// ====================================================================================================
		// INTERFACE METHODS
		// ====================================================================================================
		
		// ------------------------------
		this.Get_jContainer = function ()
		{
			return(this._jContainer);
		}
		
		
		// -----------------------------------------------------------------
		this.Set_ParentPopUpWithHotSpot = function (pParentPopUpWithHotSpot)
		{
			this._parentPopUpWithHotSpot = pParentPopUpWithHotSpot;
		}
		
		
		// ------------------------------
		this.Get_Dimensions = function ()
		{
			// Local variable for quick access.
			var dimensions	= this._imageSequenceData._dimensions;
			
			// Clone the dimensions and return so that the original is not modified.
			var dimensions = { '_x': dimensions._x, '_y': dimensions._y,	'_width': dimensions._width, '_height': dimensions._height };

			return(dimensions);
		}
		
		
		// -----------------------------------------
		this.Set_Dimensions = function (pDimensions)
		{
		}
		



		// ====================================================================================================
		// PRIVATE METHODS
		// ====================================================================================================
		
		// --------------------------------------------
		this._Initialize = function(pImageSequenceData)
		{
			var imageSequenceData	= pImageSequenceData;
			this._imageSequenceData	= imageSequenceData;
			
			var dimensions = imageSequenceData._dimensions;
			
			var jContainer = jQuery('<div>');
			this._jContainer = jContainer;
			
			// Apply css styles.
			jContainer.css('position',	'absolute');
			jContainer.css('left',		dimensions._x);
			jContainer.css('top',		dimensions._y);
			jContainer.css('width',		dimensions._width);
			jContainer.css('height',	dimensions._height);
			
			var jSequence = jQuery('<div>');
			this._jSequence = jSequence;
			jContainer.append(jSequence);
			jSequence.css('position',	'absolute');
			jSequence.css('left',		'0px');
			jSequence.css('top',		'0px');
			jSequence.css('width',		dimensions._width);
			jSequence.css('height',		dimensions._height);
			
			var jButton = jQuery('<div>');
			this._jButton = jButton;
			jContainer.append(jButton);
			jButton.css('position',	'absolute');
			jButton.css('left',		'0px');
			jButton.css('top',		'0px');
			jButton.css('width',		dimensions._width);
			jButton.css('height',		dimensions._height);
			
			
			// Create the jQuery dom objects.
			var numImages = imageSequenceData._imagePaths.length;
			
			for (var i = 0; i < numImages; i++)
			{
				// Create the image.
				var image = new Image();
				var jImage = jQuery(image);
				
				// Store pointer to jQuery dom object in the array.
				this._jImages.push(jImage);
				
				// Apply css styles.
				jImage.css('position',	'absolute');
				jImage.css('left',		'0px');
				jImage.css('top',		'0px');
				jImage.attr('width',	dimensions._width);
				jImage.attr('height',	dimensions._height);
				
				image.src = imageSequenceData._imagePaths[i];
			}
			
			// Put image in the DOM.
			this.Set_Current_Frame(imageSequenceData._initialFrame);
			
			var numFrames = imageSequenceData._imagePaths.length;
			
			this._threshold = parseInt(dimensions._width / numFrames);
			
			this._maxFrame = numFrames - 1;
			
			this._usesTouchEvents = Capabilities.Has_TouchEvents();
			
			this._Register_MouseEvents();
		}

		
		// -------------------------------------
		this._Register_MouseEvents = function ()
		{
			if (this._usesTouchEvents)
			{
				this._jButton.bind("touchmove",	jQuery.proxy(this._Handle_MouseMoveEvent, this));
				this._jContainer.bind("touchstart",	jQuery.proxy(this._Absorb_MouseMoveEvent, this));
				this._jContainer.bind("touchend",	jQuery.proxy(this._Absorb_MouseMoveEvent, this));
			}
			else
			{
				this._jButton.bind("mousemove",	jQuery.proxy(this._Handle_MouseMoveEvent, this));
				this._jContainer.bind("mousedown",	jQuery.proxy(this._Absorb_MouseMoveEvent, this));
				this._jContainer.bind("mouseup",	jQuery.proxy(this._Absorb_MouseMoveEvent, this));
			}
			
		}
		
		
		// --------------------------------------------
		this._Absorb_MouseMoveEvent = function (pEvent)
		{
			pEvent.preventDefault();
			pEvent.stopImmediatePropagation();
			pEvent.cancelBubble = true;
    		pEvent.returnValue = false;
			return false;
		}
		
		
		// --------------------------------------------
		this._Handle_MouseMoveEvent = function (pEvent)
		{
			var mouseLoc = this._Get_MouseEventData(pEvent);
			this._Advance_Frame(mouseLoc._x);
			
			pEvent.preventDefault();
			pEvent.stopImmediatePropagation();
			pEvent.cancelBubble = true;
    		pEvent.returnValue = false;
			return false;
		}


		// This method returns the point location at which the mouse event fired.
		// This location is relative to the origin of the element that trapped the event.
		// ------------------------------------------------------------------------------
		this._Get_MouseEventData = function (pEvent)
		{
			var mouseLoc;
			var originalEvent = pEvent.originalEvent;
			
			if (this._usesTouchEvents)
			{
				// jQuery stores the original event - we need it to retrieve touch data.
				var touches = originalEvent.touches;
				
				// Get the last touch point.
				var primaryTouch = touches[0];

				// Construct the mouseLoc based on the touch's location relative to the page origin.
				// We don't care about it being relative to the actual viewer because the rotation
				// algorithm simply uses the direction (positive/negative) from the last point of
				// movement in order to determine which directions to rotation - no magnitude, only direction.
				mouseLoc = { '_x': primaryTouch.pageX, '_y': primaryTouch.pageY };
			}
			else
			{
				mouseLoc = { '_x': originalEvent.layerX, '_y': originalEvent.layerY };
			}
			
			return(mouseLoc);
		}
				
		
		// ----------------------------------
		this._Advance_Frame = function(delta)
		{
			var prevDelta = this._prevDelta;
			var step = this._step;
			
			if(parseInt(Math.abs(prevDelta - delta)) >= this._threshold)
			{
				// Moved right
				if(delta > prevDelta)
				{
					if (this._prevDirection == 1)
					{
						var nextFrame	= this._step + 1;
						step = (nextFrame > this._maxFrame) ? 0 : nextFrame;
					}
					this._prevDirection = 1;
				}
				
				// Moved left
				else if (delta < prevDelta)
				{
					if (this._prevDirection == -1)
					{
						var prevFrame	= this._step - 1;
						step = (prevFrame < 0) ? this._maxFrame : prevFrame;
					}
					this._prevDirection = -1;
				}
				
				this._prevDelta = delta;
				
				this.Set_Current_Frame(step);
			}
		
		}
		
		
		// --------------------------------------
		this.Set_Current_Frame = function (pStep)
		{
			/*
			// Move the current frame to the top of the DOM.
			var jImage = this._jImages[this._step];
			jImage.detach();
			
			this._step = pStep;
			
			// Move the current frame to the top of the DOM.
			this._jSequence.append(this._jImages[this._step]);
			*/
			
			this._step = pStep;
			this._jSequence.html(this._jImages[pStep]);
		}
	
		
		// ====================================================================================================
		// CONSTRUCTOR
		// ====================================================================================================
		{
			this._Initialize(pImageSequenceData);
		}
		
		
	} // ImageSequence: End
			
