// ====================================================================================================
// Capabilities
// ====================================================================================================
// Cruz - 02/03/2012
//
// This class determines some useful capabilities that the app can use.
//
// ====================================================================================================


/* POSSIBLE ADDITIONS
	vendor = (/webkit/i).test(navigator.appVersion) ? 'webkit' :
		(/firefox/i).test(navigator.userAgent) ? 'Moz' :
		'opera' in window ? 'O' : '',

    // Browser capabilities
    isAndroid = (/android/gi).test(navigator.appVersion),
    isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
    isPlaybook = (/playbook/gi).test(navigator.appVersion),
    isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),

    has3d = 'WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix(),
    hasTouch = 'ontouchstart' in window && !isTouchPad,
    hasTransform = vendor + 'Transform' in document.documentElement.style,
    hasTransitionEnd = isIDevice || isPlaybook,
*/


	// ====================================================================================================
	// Capabilities
	// Type: Static Class
	//
	// 
	// ====================================================================================================
	var Capabilities =
	{
		
		// ====================================================================================================
		// Is_Android_Device
		// Is_Apple_Device
		// Is_Playbook_Device
		// Is_TouchPad_Device
		//
		// Type: Static Methods
		// ====================================================================================================
		// returns:
		//
		//		true	= IS specified device.
		//		false	= is NOT specified device.
		// ----------------------------------------------------------------------------------------------------
		Is_Android_Device	: function () { return ( (/android/gi).test(navigator.appVersion) );		},
		Is_Apple_Device		: function () { return ( (/iphone|ipad|mac/gi).test(navigator.appVersion) );	},
		Is_Playbook_Device	: function () { return ( (/playbook/gi).test(navigator.appVersion) );		},
		Is_TouchPad_Device	: function () { return ( (/hp-tablet/gi).test(navigator.appVersion) );		},
		


		// ====================================================================================================
		// Has_TouchEvents
		//
		// Type: Static Method
		// ====================================================================================================
		// returns:
		//
		//		true	= USES touch events
		//		false	= Does NOT use touch events.
		// ---------------------------------------------------------------------------------------------------------------
		Has_TouchEvents		: function () { return ( ('ontouchstart' in window) && !Capabilities.Is_TouchPad_Device() ); },
		
		
		
		// ====================================================================================================
		// Is_Online
		//
		// Type: Static Method
		// ====================================================================================================
		// returns:
		//
		//		true	= Online.
		//		false	= Offline (no internet connection detected)
		// ---------------------------------------------------------------------------------------------------------------
		Is_Online	: function ()
		{
			// We use a try/catch block here because the browser doesn't use the network object.
			try
			{
				// Check if offline.
				if (navigator.network.connection.type == "unknown"	|| 
					navigator.network.connection.type == "none"		||
					navigator.network.connection.type == "null")
					
					return(false);	// OFFLINE!
	
				else
					return(true); // ONLINE!
			}
			catch(e)
			{
				// Default to online.
				return(true); // ONLINE!
			}
			
		}
	};
	
	
	
	
	
	
	
	
	
