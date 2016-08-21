// ====================================================================================================
// CubeViewer
// ====================================================================================================
// Cruz - 03/01/2013
//
// This class builds a 3D cube using six images and CSS webkit 3D transforms.
// The camera is placed in the center of the cube.
// The user can rotate the cube around the camera to view the environment.
// ====================================================================================================


	// ====================================================================================================
	// CUBE VIEWER DATA
	// Type: Object
	//
	// The parameter object for a CubeViewer.
	//
	// _imagePaths: 
	//	    |5|
	//	|4| |1| |2| |3|
	//	    |6|
	// ====================================================================================================
	function CubeViewerData()
	{
		// ----------
		// PROPERTIES
		// ----------
		
		// The images to load as the six faces of the cube.
		// this._imagePaths		= ['images/interior360/cube/1.jpg', 'images/interior360/cube/2.jpg', 'images/interior360/cube/3.jpg', 'images/interior360/cube/4.jpg', 'images/interior360/cube/5.jpg', 'images/interior360/cube/6.jpg'];
		
		// The dimensions of each face of the cube. Height and Width should be equal.
		this._sideLength	=  608;
		
		// The view pane size.
		this._viewerDimensions	= { '_x': 0, '_y': 0,	'_width': 480, '_height': 320 };
		
		// The pixel shift correction so that the edges of the cube don't have any spacing between them.
		this._edgePixelShift = 1;
		
		// The initial x-axis and y-axis angles of rotation in degrees.
		this._initialRotation	= { '_x': -8, '_y': -25, '_z': 0 };
		
		// The minimum amounts of movement in any given dirction for animation to occur.
		this._mouseThresholds = { '_x': 2, '_y': 2, '_z': 0 };
		
		// The amount to rotate in any given direction when the mouseThreshold in that direction is exceeded.
		this._rotationAmounts = { '_x': 1.5, '_y': 2.8, '_z': 0};
		
		// The rotational ranges that are permitted.
		this._rotationClamping = { '_x': { '_min': -90, '_max': 90 }, '_y': null, '_z': null };
	}
	
	
	
	// ====================================================================================================
	// CUBE VIEWER
	// Type: Object
	//
	//	Parameters:
	//
	//		pCubeViewerData:		Used to initialize the viewer.
	//
	// ====================================================================================================
	function CubeViewer(pCubeViewerData)
	{
		// ----------
		// PROPERTIES
		// ----------

		// Internal Data
		this._cubeViewerData			= null;												// Pointer to parameter data
		this._currentRotation			= { '_x': 0, '_y': 0, '_z': 0};						// The current x,y,z-axis angles of rotation in degrees.
		this._cameraPosition			= { '_x': 0, '_y': 0, '_z': 0, '_perspective': 0 };	// The position of the camera and viewport perspective - autocomputed to be center of the cube.
	
		this._sideTransformations		= null;												// The css transformations to apply to each side to build the cube.
		
		this._usesTouchEvents			= false;											// Flag indicating whether to use TouchEvents or MouseEvents.
		
		this._trackingMouseMovement 	= false;											// Flag indicates if we are tracking mouse movement.
		this._previousMouseLoc;																// Pointer to the previous mouse location when tracking mouse movement.
		
		this._parentPopUpWithHotSpot	= null;												// The parent popup with hotspot that contains this content.


		// DOM Pointers							// Pointers to the jQuery DOM objects for...
		this._jContainer			= null;		// ...the container for this component.
		this._jViewer				= null;		// ...the object that contains the world.
		this._jCube					= null;		// ...the object that contains the cube faces.
		this._jSides				= [];		// ...the array of cube faces.
		
		// The world is no longer needed because I discovered that once I turned off transform-3d on the viewer then mouse moves worked in the browsers.
		//this._jWorld			= null;		// ...the object that contains the cube.
		
		
		
		// -----------------
		// INTERFACE METHODS
		// -----------------
		
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
			var viewerDimensions	= this._cubeViewerData._viewerDimensions;
			
			// Clone the dimensions and return so that the original is not modified.
			var dimensions = { '_x': viewerDimensions._x, '_y': viewerDimensions._y,	'_width': viewerDimensions._width, '_height': viewerDimensions._height };

			return(dimensions);
		}
		
		
		// -----------------------------------------
		this.Set_Dimensions = function (pDimensions)
		{
			// Local vars for quick access.
			var jViewer				= this._jViewer;
			var viewerDimensions	= this._cubeViewerData._viewerDimensions;
			var dimensions			= pDimensions;
			
			// Update the internal dimensions.
			viewerDimensions._x			= dimensions._x;
			viewerDimensions._y			= dimensions._y;
			viewerDimensions._width		= dimensions._width;
			viewerDimensions._height	= dimensions._height;
			
			// Update the dom properties.
			jViewer.css('left',		viewerDimensions._x + 'px');
			jViewer.css('top', 		viewerDimensions._y + 'px');
			jViewer.css('width',	viewerDimensions._width + 'px');
			jViewer.css('height',	viewerDimensions._height + 'px');
		}
		

		// ------------------------
		this.Activate = function ()
		{
			/*
			this.Reset_Orientation();
			this.Add_Side_Transformations();
			*/
		}
		
		
		// --------------------------
		this.Deactivate = function ()
		{
			/*
			this.Clear_Cube_Rotation();
			this.Remove_Side_Transformations();
			*/
		}
		
		

		// -------
		// METHODS
		// -------
		
		// ---------------------------------
		this.Reset_Orientation = function ()
		{
			this.Set_Cube_Rotation(this._cubeViewerData._initialRotation);
		}
		
		
		// -----------------------------------------
		this.Initialize = function (pCubeViewerData)
		{
			this._usesTouchEvents	= Capabilities.Has_TouchEvents();	// Determine if the app can use touch events.
			
			var cubeViewerData		= pCubeViewerData;					// Local var for fast access.
			
			this._cubeViewerData	= cubeViewerData;					// Store in internal property.
			
			
			// Determine the camera position so the viewport appears centered in the viewer.

			// Local vars for fast access.
			var viewerDimensions	= cubeViewerData._viewerDimensions;
			var sideLength			= cubeViewerData._sideLength;
			
			var xPosition			= -(sideLength - viewerDimensions._width) / 2;
			var yPosition			= -(sideLength - viewerDimensions._height) / 2;
			var zPosition			= sideLength / 2;
			var perspective			= zPosition;
			
			this._cameraPosition	= { '_x': xPosition, '_y': yPosition, '_z': zPosition, '_perspective': perspective };

			
			this.Create_DOM_Objects();
			
			this.Reset_Orientation();
			this.Add_Side_Transformations();
		}
		
		
		// ----------------------------------
		this.Create_DOM_Objects = function ()
		{
			// NOTE:
			// I originally had to put the cube in a world and then in the viewer which has the perspective because
			// otherwise the repaints on the cube rotation were not happening reliably for some unknown reason.
			// I've since discovered that turning off preserve-3d on the viewer would allow mouse moves to function 
			// appropriately in the browsers.
			
			this.Create_Container();
			
			this.Create_Viewer();
			//this.Create_World();
			this.Create_Cube();
			
			this.Register_MouseEvents();
		}
		
		
		// --------------------------------
		this.Create_Container = function ()
		{
			// Create the jQuery dom object.
			var jContainer = jQuery('<div>');
			
			// Store pointer to jQuery dom object.
			this._jContainer = jContainer;

			// Apply css styles.
			// NOTE: This object is positioned absolutely so that all of its child objects can be positioned properly.
			jContainer.css('position',		'absolute');

			jContainer.css('left',			'0px');
			jContainer.css('top', 			'0px');
		}
		
		
		// -----------------------------
		this.Create_Viewer = function ()
		{
			// Local vars for fast access.
			var viewerDimensions	= this._cubeViewerData._viewerDimensions;
			var perspective			= this._cameraPosition._perspective;
			
			// Create the jQuery dom object.
			var jViewer = jQuery('<div>');

			// Store pointer to jQuery dom object.
			this._jViewer = jViewer;
			
			jViewer.css('position',						'absolute');
			jViewer.css('overflow',						'hidden');
			jViewer.css('-webkit-perspective',			perspective);
			jViewer.css('-webkit-perspective-origin',	'center');
			jViewer.css('cursor',						'move');
			
			// Set the css dimensions.
			this.Set_Dimensions(viewerDimensions);

			// preserve-3d must be turned off otherwise the mousemove events will not fire continuously in a web browser.
			// I discovered this after the "world" implementation, and so now you'll see that all code related to the world
			// is commented out.
			//jViewer.css('-webkit-transform-style',	'preserve-3d');

			this._jContainer.append(jViewer);
		}
		
		
		/*
		// ----------------------------
		this.Create_World = function ()
		{
			// Local vars for fast access.
			var viewerDimensions	= this._cubeViewerData._viewerDimensions;
			
			this._jWorld = jQuery('<div>');
			this._jWorld.css('position',					'relative');
			this._jWorld.css('left',						'0px');
			this._jWorld.css('top', 						'0px');
			this._jWorld.css('-webkit-transform-style',		'preserve-3d');
		}
		*/
		
		// ---------------------------
		this.Create_Cube = function ()
		{
			// Local vars for fast access.
			var sideLength			= this._cubeViewerData._sideLength;
			var initialRotation		= this._cubeViewerData._initialRotation;
			var cameraPosition		= this._cameraPosition;
			
			// Update the current rotation.
			this._currentRotation = initialRotation;
			
			// Create the jQuery dom object.
			var jCube	= jQuery('<div>');

			// Store pointer to jQuery dom object.
			this._jCube	= jCube;
			
			jCube.css('position',					'absolute');
			jCube.css('width',						sideLength + 'px');
			jCube.css('height',						sideLength + 'px');
			jCube.css('-webkit-transform-style',	'preserve-3d');
			
			var offset = (sideLength / 2) - this._cubeViewerData._edgePixelShift;
			
			//	    |5|
			//	|4| |1| |2| |3|
			//	    |6|
			this._sideTransformations = [
											'translateZ(' + (-offset) + 'px)	rotateY(  0deg)',
											'translateX(' + ( offset) + 'px)	rotateY(270deg)',
											'translateZ(' + ( offset) + 'px)	rotateY(180deg)',
											'translateX(' + (-offset) + 'px)	rotateY( 90deg)',
											'translateY(' + (-offset) + 'px)	rotateX(270deg)',
											'translateY(' + ( offset) + 'px)	rotateX( 90deg)'
										];
										
										
			// Create the sides and append them to the cube.
			for (var i = 0; i < 6; i++)
			{
				var imagePaths = this._cubeViewerData._imagePaths;
				
				var jSide = jQuery('<img>');
				jSide.attr('width',							sideLength);
				jSide.attr('height',						sideLength);

				jSide.css('display',						'block');
				jSide.css('width',							sideLength + 'px');
				jSide.css('height',							sideLength + 'px');
				jSide.css('position',						'absolute');
				jSide.css('top',							'0px');
				jSide.css('left',							'0px');
				jSide.css('-webkit-backface-visibility',	'visible');
				
				//jSide.css('background-color', '#000');
								
				jSide.attr('src',							imagePaths[i]);

				// Store in property array.
				this._jSides.push(jSide);
				
				// Append to dom.
				jCube.append(jSide);
			}
			
			this._jViewer.append(jCube);
		}
		
		
		// ----------------------------------------
		this.Add_Side_Transformations = function ()
		{
			// Local vars for quick access.
			var sideTransformations	= this._sideTransformations;
			var jSides				= this._jSides;
			
			// Apply the transformation to each side.
			for (var i = 0; i < 6; i++)
			{
				var jSide = jSides[i];
				jSide.css('-webkit-transform', sideTransformations[i]);
			}
		}
		
	
		// -------------------------------------------
		this.Remove_Side_Transformations = function ()
		{
			// Local var for quick access.
			var jSides				= this._jSides;
			
			// Remove the transformation from each side.
			for (var i = 0; i < 6; i++)
			{
				var jSide = jSides[i];
				jSide.css('-webkit-transform', '');
			}
		}
		
	
		// ------------------------------------
		this.Register_MouseEvents = function ()
		{
			if (this._usesTouchEvents)
			{
				this._jViewer.bind('touchstart',	jQuery.proxy(this.Handle_MouseDownEvent,	this));
				this._jViewer.bind('touchend',		jQuery.proxy(this.Handle_MouseUpEvent,		this));
			}
			else
			{
				this._jViewer.bind('mousedown',		jQuery.proxy(this.Handle_MouseDownEvent,	this));
				this._jViewer.bind('mouseup',		jQuery.proxy(this.Handle_MouseUpEvent,		this));
			}
		}
		
		
		// ------------------------------------
		this.Bind_MouseMoveEvents = function ()
		{
			if (this._usesTouchEvents)
			{
				this._jViewer.bind('touchmove',		jQuery.proxy(this.Handle_MouseMoveEvent,	this));
			}
			else
			{
				this._jViewer.bind('mousemove',		jQuery.proxy(this.Handle_MouseMoveEvent,	this));
				this._jViewer.bind('mouseleave',	jQuery.proxy(this.Handle_MouseLeaveEvent,	this));	// Bind to mouseout to kill the rotation.
			}
		}
		
		
		// --------------------------------------
		this.Unbind_MouseMoveEvents = function ()
		{
			if (this._usesTouchEvents)
			{
				this._jViewer.unbind('touchmove',	this.Handle_MouseMoveEvent);
			}
			else
			{
				this._jViewer.unbind('mousemove',	this.Handle_MouseMoveEvent);
				this._jViewer.unbind('mouseleave',	this.Handle_MouseLeaveEvent);
			}
		}
		
		
		// This method returns the point location at which the mouse event fired.
		// This location is relative to the origin of the element that trapped the event.
		// ------------------------------------------------------------------------------
		this.Get_MouseEventData = function (pEvent)
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
				mouseLoc = { '_x': originalEvent.pageX, '_y': originalEvent.pageY };
			}
			
			return(mouseLoc);
		}
		
		
		// -------------------------------------------
		this.Handle_MouseDownEvent = function (pEvent)
		{
		    pEvent.preventDefault();
			pEvent.stopImmediatePropagation();
			
			var mouseLoc = this.Get_MouseEventData(pEvent);

			// Initialize the previous mouse loc as this click location.
			this._previousMouseLoc = mouseLoc;
			
			// Turn on tracking flag.
			this._trackingMouseMovement	= true;
			
			this.Bind_MouseMoveEvents();
		}
		
		
		// --------------------------------------------
		this.Handle_MouseLeaveEvent = function (pEvent)
		{
			if (this._trackingMouseMovement)
			{
				pEvent.preventDefault();
				pEvent.stopImmediatePropagation();
				
				this.Unbind_MouseMoveEvents();
				this._trackingMouseMovement	= false;
			}
		}
		
		
		// -----------------------------------------
		this.Handle_MouseUpEvent = function (pEvent)
		{
			if (this._trackingMouseMovement)
			{
				pEvent.preventDefault();
				pEvent.stopImmediatePropagation();
	
				this.Unbind_MouseMoveEvents();
				this._trackingMouseMovement	= false;
			}
		}
		
		
		// -------------------------------------------
		this.Handle_MouseMoveEvent = function (pEvent)
		{
		    pEvent.preventDefault();
			pEvent.stopImmediatePropagation();
			
			// Determine the directions of movement.
			var mouseThresholds		= this._cubeViewerData._mouseThresholds;
			var rotationAmounts 	= this._cubeViewerData._rotationAmounts;
			var mouseLoc			= this.Get_MouseEventData(pEvent);
			var prevLoc				= this._previousMouseLoc;
			var directions			= { '_x': mouseLoc._x - prevLoc._x, '_y': mouseLoc._y - prevLoc._y, '_z': 0 };
			
			// Determine the rotational values based on the direction of movement.
			var rotation	= { '_x': 0, '_y': 0, '_z': 0 };
			
			 // NOTE: Mouse Xdirection affects Y rotation, Mouse Ydirection affects X rotation.
			// Update the previous loc pointer to point to the new location only for each axis IF the movement exceeded the threshold.
			if		(directions._x > mouseThresholds._x)	{ rotation._y = -rotationAmounts._y;	this._previousMouseLoc._x = mouseLoc._x; }
			else if	(directions._x < -mouseThresholds._x)	{ rotation._y =  rotationAmounts._y;	this._previousMouseLoc._x = mouseLoc._x; }
			
			if		(directions._y > mouseThresholds._y)	{ rotation._x = rotationAmounts._x;		this._previousMouseLoc._y = mouseLoc._y; }
			else if	(directions._y < -mouseThresholds._y)	{ rotation._x = -rotationAmounts._x;	this._previousMouseLoc._y = mouseLoc._y; }
			
			if		(directions._z > mouseThresholds._z)	{ rotation._z = rotationAmounts._z;		this._previousMouseLoc._z = mouseLoc._z; }
			else if	(directions._z < -mouseThresholds._z)	{ rotation._z = -rotationAmounts._z;	this._previousMouseLoc._z = mouseLoc._z; }
			
			
			// Create the rotation object.
			var newRotation = { '_x': this._currentRotation._x + rotation._x, '_y': this._currentRotation._y + rotation._y, '_z': this._currentRotation._z + rotation._z };
			
			// Clamp values.
			newRotation = this.Clamp_Rotation(newRotation);
			
			// Normalize values.
			newRotation = this.Normalize_Rotation(newRotation);
			
			// Now set the new rotation.
			this.Set_Cube_Rotation(newRotation);
		}
		
		
		// We want all values to fall between -360 and 360. It's just cleaner rotational math.
		// NOTE: This method clones the incoming parameter and returns the new clone so as to protect 
		// the original parameter for the developer. This is because JS passes objects by reference.
		// ------------------------------------------------------------------------------------------
		this.Normalize_Rotation = function (pRotation)
		{
			var rotation	= { '_x': pRotation._x, '_y': pRotation._y, '_z': pRotation._z };
			
			if		(pRotation._x >  360)	rotation._x = pRotation._x - 360;
			else if	(pRotation._x < -360)	rotation._x = pRotation._x + 360;
			
			if		(pRotation._y >  360)	rotation._y = pRotation._y - 360;
			else if	(pRotation._y < -360)	rotation._y = pRotation._y + 360;
			
			if		(pRotation._z >  360)	rotation._z = pRotation._z - 360;
			else if	(pRotation._z < -360)	rotation._z = pRotation._z + 360;
			
			return(rotation);
		}
		
		
		// Ensure that all values fall within the specified ranges - clamping to the max and min values.
		// NOTE: This method clones the incoming parameter and returns the new clone so as to protect 
		// the original parameter for the developer. This is because JS passes objects by reference.
		// ---------------------------------------------------------------------------------------------
		this.Clamp_Rotation = function (pRotation)
		{
			var rotation	= { '_x': pRotation._x, '_y': pRotation._y, '_z': pRotation._z };
			
			var rotationClamping	= this._cubeViewerData._rotationClamping;

			if (rotationClamping._x)
			{
				if		(pRotation._x > rotationClamping._x._max)	{ rotation._x = rotationClamping._x._max; }
				else if	(pRotation._x < rotationClamping._x._min)	{ rotation._x = rotationClamping._x._min; }
			}
			
			if (rotationClamping._y)
			{
				if		(pRotation._y > rotationClamping._y._max)	{ rotation._y = rotationClamping._y._max; }
				else if	(pRotation._y < rotationClamping._y._min)	{ rotation._y = rotationClamping._y._min; }
			}
			
			if (rotationClamping._z)
			{
				if		(pRotation._z > rotationClamping._z._max)	{ rotation._z = rotationClamping._z._max; }
				else if	(pRotation._z < rotationClamping._z._min)	{ rotation._z = rotationClamping._z._min; }
			}
			
			return(rotation);
		}
		
		
		// ---------------------------------------------
		this.Set_Cube_Rotation = function (pNewRotation)
		{
			var cameraPosition = this._cameraPosition;
			var newRotation = pNewRotation;

			// Clamp values.
			newRotation = this.Clamp_Rotation(newRotation);
			
			// Normalize values.
			newRotation = this.Normalize_Rotation(newRotation);

			this._currentRotation = newRotation;
			
			this._jCube.css('-webkit-transform', 'translateX(' + cameraPosition._x + 'px) translateY(' + cameraPosition._y + 'px) translateZ(' + cameraPosition._z + 'px) rotateX(' + newRotation._x + 'deg) rotateY(' + newRotation._y + 'deg) rotateZ(' + newRotation._z + 'deg)');
		}
		
		
		// Disable the cube rotation.
		// -----------------------------------
		this.Clear_Cube_Rotation = function ()
		{
			this._jCube.css('-webkit-transform', '');
		}
		
		
		// -----------
		// CONSTRUCTOR
		// -----------
		{
			this.Initialize(pCubeViewerData);
		}
		
		
	} // END: CubeViewer





