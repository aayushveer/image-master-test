/**
 * IMAGE-METADATA.JS - World's Best Image Metadata Extractor
 * Using EXIFR library for comprehensive metadata extraction
 * Extracts ALL metadata: EXIF, IPTC, XMP, GPS, ICC, JFIF, IHDR, and more
 */

(function() {
    'use strict';

    // ================== STATE ==================
    let currentFile = null;
    let currentMetadata = {};
    let allRawMetadata = {};
    let originalImageData = null;

    // ================== DOM ELEMENTS ==================
    const elements = {
        // Pages
        pageUpload: document.getElementById('page-upload'),
        pageViewer: document.getElementById('page-viewer'),
        infoSection: document.getElementById('info-section'),
        
        // File inputs
        fileInput: document.getElementById('file-input'),
        fileInputNew: document.getElementById('file-input-new'),
        dropzone: document.getElementById('dropzone'),
        
        // Preview
        previewImage: document.getElementById('preview-image'),
        fileName: document.getElementById('file-name'),
        fileSize: document.getElementById('file-size'),
        fileDimensions: document.getElementById('file-dimensions'),
        fileType: document.getElementById('file-type'),
        
        // Actions
        btnRemoveMetadata: document.getElementById('btn-remove-metadata'),
        btnExportJson: document.getElementById('btn-export-json'),
        btnCopyAll: document.getElementById('btn-copy-all'),
        btnCopyGps: document.getElementById('btn-copy-gps'),
        
        // GPS
        mapSection: document.getElementById('map-section'),
        gpsMap: document.getElementById('gps-map'),
        gpsLat: document.getElementById('gps-lat'),
        gpsLng: document.getElementById('gps-lng'),
        gpsAlt: document.getElementById('gps-alt'),
        
        // Stats
        statCamera: document.getElementById('stat-camera'),
        statDate: document.getElementById('stat-date'),
        statLens: document.getElementById('stat-lens'),
        statSettings: document.getElementById('stat-settings'),
        
        // Tabs
        tabs: document.querySelectorAll('.tab'),
        
        // Search
        metadataSearch: document.getElementById('metadata-search'),
        searchCount: document.getElementById('search-count'),
        
        // Tables
        tableBasic: document.getElementById('table-basic'),
        tableCamera: document.getElementById('table-camera'),
        tableExif: document.getElementById('table-exif'),
        tableGps: document.getElementById('table-gps'),
        tableAdvanced: document.getElementById('table-advanced'),
        
        // Counts
        countBasic: document.getElementById('count-basic'),
        countCamera: document.getElementById('count-camera'),
        countExif: document.getElementById('count-exif'),
        countGps: document.getElementById('count-gps'),
        countAdvanced: document.getElementById('count-advanced'),
        totalFields: document.getElementById('total-fields'),
        
        // Groups
        metadataGroups: document.querySelectorAll('.metadata-group')
    };

    // ================== FRIENDLY NAMES MAPPING ==================
    const FRIENDLY_NAMES = {
        // Basic
        'ImageWidth': 'Image Width',
        'ImageHeight': 'Image Height',
        'ImageSize': 'Image Size',
        'Megapixels': 'Megapixels',
        'BitDepth': 'Bit Depth',
        'ColorType': 'Color Type',
        'BitsPerSample': 'Bits Per Sample',
        'SamplesPerPixel': 'Samples Per Pixel',
        
        // Camera
        'Make': 'Camera Make',
        'Model': 'Camera Model',
        'LensMake': 'Lens Manufacturer',
        'LensModel': 'Lens Model',
        'LensInfo': 'Lens Info',
        'Lens': 'Lens',
        'LensSerialNumber': 'Lens Serial Number',
        'SerialNumber': 'Camera Serial Number',
        'InternalSerialNumber': 'Internal Serial Number',
        'BodySerialNumber': 'Body Serial Number',
        'CameraSerialNumber': 'Camera Serial Number',
        'Software': 'Software',
        'ProcessingSoftware': 'Processing Software',
        'Artist': 'Artist/Photographer',
        'Copyright': 'Copyright',
        'ImageDescription': 'Image Description',
        'UserComment': 'User Comment',
        'OwnerName': 'Owner Name',
        'CameraOwnerName': 'Camera Owner',
        
        // Exposure
        'ExposureTime': 'Shutter Speed',
        'ShutterSpeedValue': 'Shutter Speed Value',
        'FNumber': 'Aperture (f-stop)',
        'ApertureValue': 'Aperture Value',
        'ISO': 'ISO Speed',
        'ISOSpeedRatings': 'ISO Speed Ratings',
        'PhotographicSensitivity': 'Photographic Sensitivity',
        'ExposureProgram': 'Exposure Program',
        'ExposureMode': 'Exposure Mode',
        'ExposureCompensation': 'Exposure Compensation',
        'ExposureBiasValue': 'Exposure Bias',
        'MeteringMode': 'Metering Mode',
        'LightSource': 'Light Source',
        'BrightnessValue': 'Brightness',
        
        // Flash
        'Flash': 'Flash',
        'FlashMode': 'Flash Mode',
        'FlashEnergy': 'Flash Energy',
        'FlashpixVersion': 'FlashPix Version',
        
        // Focus & Lens
        'FocalLength': 'Focal Length',
        'FocalLengthIn35mmFormat': 'Focal Length (35mm)',
        'FocalPlaneXResolution': 'Focal Plane X Resolution',
        'FocalPlaneYResolution': 'Focal Plane Y Resolution',
        'FocalPlaneResolutionUnit': 'Focal Plane Resolution Unit',
        'SubjectDistance': 'Subject Distance',
        'SubjectDistanceRange': 'Subject Distance Range',
        'MaxApertureValue': 'Max Aperture',
        'FocusMode': 'Focus Mode',
        'AFAreaMode': 'AF Area Mode',
        
        // Color
        'WhiteBalance': 'White Balance',
        'WhiteBalanceMode': 'White Balance Mode',
        'ColorSpace': 'Color Space',
        'Contrast': 'Contrast',
        'Saturation': 'Saturation',
        'Sharpness': 'Sharpness',
        'DigitalZoomRatio': 'Digital Zoom',
        'SceneCaptureType': 'Scene Capture Type',
        'SceneType': 'Scene Type',
        'GainControl': 'Gain Control',
        
        // Date/Time
        'DateTimeOriginal': 'Date Taken',
        'CreateDate': 'Date Created',
        'ModifyDate': 'Date Modified',
        'DateTime': 'Date/Time',
        'DateTimeDigitized': 'Date Digitized',
        'SubSecTime': 'Sub-second Time',
        'SubSecTimeOriginal': 'Sub-second Time Original',
        'SubSecTimeDigitized': 'Sub-second Time Digitized',
        'OffsetTime': 'Timezone Offset',
        'OffsetTimeOriginal': 'Timezone (Original)',
        'OffsetTimeDigitized': 'Timezone (Digitized)',
        
        // GPS
        'GPSLatitude': 'GPS Latitude',
        'GPSLongitude': 'GPS Longitude',
        'GPSLatitudeRef': 'GPS Latitude Ref',
        'GPSLongitudeRef': 'GPS Longitude Ref',
        'GPSAltitude': 'GPS Altitude',
        'GPSAltitudeRef': 'GPS Altitude Ref',
        'GPSTimeStamp': 'GPS Time',
        'GPSDateStamp': 'GPS Date',
        'GPSSpeed': 'GPS Speed',
        'GPSSpeedRef': 'GPS Speed Ref',
        'GPSImgDirection': 'GPS Image Direction',
        'GPSImgDirectionRef': 'GPS Direction Ref',
        'GPSDestLatitude': 'GPS Dest Latitude',
        'GPSDestLongitude': 'GPS Dest Longitude',
        'GPSProcessingMethod': 'GPS Processing Method',
        'GPSAreaInformation': 'GPS Area Info',
        'GPSVersionID': 'GPS Version',
        'GPSMapDatum': 'GPS Map Datum',
        'latitude': 'Latitude (Decimal)',
        'longitude': 'Longitude (Decimal)',
        
        // Image
        'Orientation': 'Orientation',
        'XResolution': 'X Resolution (DPI)',
        'YResolution': 'Y Resolution (DPI)',
        'ResolutionUnit': 'Resolution Unit',
        'Compression': 'Compression',
        'PhotometricInterpretation': 'Photometric Interpretation',
        'PlanarConfiguration': 'Planar Configuration',
        'YCbCrSubSampling': 'YCbCr SubSampling',
        'YCbCrPositioning': 'YCbCr Positioning',
        
        // EXIF
        'ExifVersion': 'EXIF Version',
        'ExifImageWidth': 'EXIF Image Width',
        'ExifImageHeight': 'EXIF Image Height',
        'ComponentsConfiguration': 'Components Configuration',
        'CompressedBitsPerPixel': 'Compressed Bits/Pixel',
        'PixelXDimension': 'Pixel X Dimension',
        'PixelYDimension': 'Pixel Y Dimension',
        'ImageUniqueID': 'Image Unique ID',
        'InteropIndex': 'Interoperability Index',
        'SensingMethod': 'Sensing Method',
        'FileSource': 'File Source',
        'CustomRendered': 'Custom Rendered',
        'CFAPattern': 'CFA Pattern',
        
        // Thumbnail
        'ThumbnailOffset': 'Thumbnail Offset',
        'ThumbnailLength': 'Thumbnail Length',
        'ThumbnailImage': 'Thumbnail Present',
        
        // XMP
        'Rating': 'Rating',
        'RatingPercent': 'Rating Percent',
        'Label': 'Label',
        'Title': 'Title',
        'Description': 'Description',
        'Subject': 'Subject/Keywords',
        'Creator': 'Creator',
        'Rights': 'Rights',
        'MetadataDate': 'Metadata Date',
        'CreatorTool': 'Creator Tool',
        'DocumentID': 'Document ID',
        'InstanceID': 'Instance ID',
        'OriginalDocumentID': 'Original Document ID',
        
        // IPTC
        'Headline': 'Headline',
        'Caption': 'Caption',
        'Keywords': 'Keywords',
        'City': 'City',
        'State': 'State/Province',
        'Country': 'Country',
        'CountryCode': 'Country Code',
        'Location': 'Location',
        'Credit': 'Credit',
        'Source': 'Source',
        'CopyrightNotice': 'Copyright Notice',
        'Contact': 'Contact',
        'Writer': 'Writer/Editor',
        'Category': 'Category',
        'SupplementalCategories': 'Supplemental Categories',
        'TransmissionReference': 'Transmission Reference',
        'Urgency': 'Urgency',
        'ObjectName': 'Object Name',
        'DateCreated': 'Date Created (IPTC)',
        'TimeCreated': 'Time Created (IPTC)',
        
        // ICC Profile
        'ProfileDescription': 'ICC Profile Description',
        'ProfileClass': 'ICC Profile Class',
        'ColorSpaceData': 'Color Space Data',
        'ProfileConnectionSpace': 'Profile Connection Space',
        'ProfileCreator': 'Profile Creator',
        'ProfileCopyright': 'Profile Copyright',
        'ProfileDateTime': 'Profile Date/Time',
        'DeviceMfgDesc': 'Device Manufacturer',
        'DeviceModelDesc': 'Device Model',
        'RenderingIntent': 'Rendering Intent',
        'MediaWhitePoint': 'Media White Point',
        
        // Maker Notes (Camera Specific)
        'ShutterCount': 'Shutter Count',
        'ImageCount': 'Image Count',
        'ImageStabilization': 'Image Stabilization',
        'VibrationReduction': 'Vibration Reduction',
        'MacroMode': 'Macro Mode',
        'Quality': 'Quality Setting',
        'FocusDistance': 'Focus Distance',
        'DriveMode': 'Drive Mode',
        'ContinuousDrive': 'Continuous Drive',
        'SelfTimer': 'Self Timer',
        'AFPoint': 'AF Point',
        'AFPointsInFocus': 'AF Points In Focus'
    };

    // ================== EXIF VALUE MAPPINGS ==================
    const EXIF_MAPPINGS = {
        Orientation: {
            1: 'Horizontal (normal)',
            2: 'Mirror horizontal',
            3: 'Rotate 180°',
            4: 'Mirror vertical',
            5: 'Mirror horizontal, rotate 270° CW',
            6: 'Rotate 90° CW',
            7: 'Mirror horizontal, rotate 90° CW',
            8: 'Rotate 270° CW'
        },
        ExposureProgram: {
            0: 'Not defined',
            1: 'Manual',
            2: 'Program AE',
            3: 'Aperture Priority',
            4: 'Shutter Priority',
            5: 'Creative (depth of field)',
            6: 'Action (fast shutter)',
            7: 'Portrait',
            8: 'Landscape',
            9: 'Bulb'
        },
        MeteringMode: {
            0: 'Unknown',
            1: 'Average',
            2: 'Center-weighted average',
            3: 'Spot',
            4: 'Multi-spot',
            5: 'Pattern (matrix)',
            6: 'Partial',
            255: 'Other'
        },
        Flash: {
            0: 'No Flash',
            1: 'Flash Fired',
            5: 'Flash Fired, Strobe Return not detected',
            7: 'Flash Fired, Strobe Return detected',
            9: 'Flash Fired, Compulsory',
            13: 'Flash Fired, Compulsory, Return not detected',
            15: 'Flash Fired, Compulsory, Return detected',
            16: 'Flash Did Not Fire, Compulsory',
            24: 'Flash Did Not Fire, Auto',
            25: 'Flash Fired, Auto',
            29: 'Flash Fired, Auto, Return not detected',
            31: 'Flash Fired, Auto, Return detected',
            32: 'No Flash Function',
            48: 'Flash Did Not Fire, No Flash Function',
            65: 'Flash Fired, Red-eye reduction',
            69: 'Flash Fired, Red-eye, Return not detected',
            71: 'Flash Fired, Red-eye, Return detected',
            73: 'Flash Fired, Compulsory, Red-eye',
            77: 'Flash Fired, Compulsory, Red-eye, Return not detected',
            79: 'Flash Fired, Compulsory, Red-eye, Return detected',
            89: 'Flash Fired, Auto, Red-eye',
            93: 'Flash Fired, Auto, Red-eye, Return not detected',
            95: 'Flash Fired, Auto, Red-eye, Return detected'
        },
        WhiteBalance: {
            0: 'Auto',
            1: 'Manual',
            2: 'Auto (bias)',
            3: 'Auto (ambiance)',
            4: 'Auto (white)'
        },
        LightSource: {
            0: 'Unknown',
            1: 'Daylight',
            2: 'Fluorescent',
            3: 'Tungsten',
            4: 'Flash',
            9: 'Fine Weather',
            10: 'Cloudy',
            11: 'Shade',
            12: 'Daylight Fluorescent',
            13: 'Day White Fluorescent',
            14: 'Cool White Fluorescent',
            15: 'White Fluorescent',
            17: 'Standard Light A',
            18: 'Standard Light B',
            19: 'Standard Light C',
            20: 'D55',
            21: 'D65',
            22: 'D75',
            23: 'D50',
            24: 'ISO Studio Tungsten',
            255: 'Other'
        },
        ColorSpace: {
            1: 'sRGB',
            2: 'Adobe RGB',
            65535: 'Uncalibrated'
        },
        ExposureMode: {
            0: 'Auto',
            1: 'Manual',
            2: 'Auto Bracket'
        },
        SceneCaptureType: {
            0: 'Standard',
            1: 'Landscape',
            2: 'Portrait',
            3: 'Night Scene',
            4: 'Other'
        },
        ResolutionUnit: {
            1: 'None',
            2: 'inches',
            3: 'centimeters'
        },
        SensingMethod: {
            1: 'Not defined',
            2: 'One-chip color area',
            3: 'Two-chip color area',
            4: 'Three-chip color area',
            5: 'Color sequential area',
            7: 'Trilinear',
            8: 'Color sequential linear'
        },
        Contrast: {
            0: 'Normal',
            1: 'Low',
            2: 'High'
        },
        Saturation: {
            0: 'Normal',
            1: 'Low',
            2: 'High'
        },
        Sharpness: {
            0: 'Normal',
            1: 'Soft',
            2: 'Hard'
        },
        SubjectDistanceRange: {
            0: 'Unknown',
            1: 'Macro',
            2: 'Close',
            3: 'Distant'
        },
        GainControl: {
            0: 'None',
            1: 'Low gain up',
            2: 'High gain up',
            3: 'Low gain down',
            4: 'High gain down'
        },
        CustomRendered: {
            0: 'Normal',
            1: 'Custom'
        },
        FileSource: {
            1: 'Film Scanner',
            2: 'Reflection Print Scanner',
            3: 'Digital Camera'
        }
    };

    // ================== CATEGORY DEFINITIONS ==================
    const CATEGORY_KEYWORDS = {
        basic: ['FileName', 'FileSize', 'FileType', 'MIMEType', 'ImageWidth', 'ImageHeight', 'ImageSize', 
                'Megapixels', 'BitDepth', 'ColorType', 'BitsPerSample', 'SamplesPerPixel', 'Compression',
                'FileFormat', 'FileExtension', 'FileSizeBytes', 'FileModifyDate', 'JFIFVersion', 'JFIFUnits',
                'PNGBitDepth', 'PNGColorType', 'PNGCompression', 'PNGInterlace', 'HasAlpha', 'ColorComponents',
                'JPEGCompression', 'Width', 'Height', 'PixelWidth', 'PixelHeight'],
                
        camera: ['Make', 'Model', 'LensMake', 'LensModel', 'LensInfo', 'Lens', 'LensSerialNumber',
                 'SerialNumber', 'InternalSerialNumber', 'BodySerialNumber', 'CameraSerialNumber',
                 'Software', 'ProcessingSoftware', 'HostComputer', 'Artist', 'Copyright', 'OwnerName',
                 'CameraOwnerName', 'ImageDescription', 'UserComment', 'UniqueCameraModel', 'FirmwareVersion',
                 'CameraType', 'LensType', 'LensSpec', 'DeviceMfgDesc', 'DeviceModelDesc'],
                 
        exif: ['ExposureTime', 'ShutterSpeedValue', 'FNumber', 'ApertureValue', 'ISO', 'ISOSpeedRatings',
               'PhotographicSensitivity', 'ExposureProgram', 'ExposureMode', 'ExposureCompensation',
               'ExposureBiasValue', 'MeteringMode', 'LightSource', 'Flash', 'FlashMode', 'FlashEnergy',
               'FocalLength', 'FocalLengthIn35mmFormat', 'FocalPlaneXResolution', 'FocalPlaneYResolution',
               'WhiteBalance', 'WhiteBalanceMode', 'ColorSpace', 'Contrast', 'Saturation', 'Sharpness',
               'DigitalZoomRatio', 'SceneCaptureType', 'SceneType', 'GainControl', 'BrightnessValue',
               'SubjectDistance', 'SubjectDistanceRange', 'MaxApertureValue', 'FocusMode', 'AFAreaMode',
               'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'DateTime', 'DateTimeDigitized',
               'SubSecTime', 'SubSecTimeOriginal', 'SubSecTimeDigitized', 'OffsetTime',
               'Orientation', 'XResolution', 'YResolution', 'ResolutionUnit', 'ExifVersion',
               'ExifImageWidth', 'ExifImageHeight', 'PixelXDimension', 'PixelYDimension',
               'SensingMethod', 'FileSource', 'CustomRendered', 'CFAPattern', 'ImageUniqueID',
               'ShutterCount', 'ImageStabilization', 'VibrationReduction', 'Quality', 'DriveMode',
               'SelfTimer', 'AFPoint', 'MacroMode', 'FocusDistance', 'SubjectArea'],
               
        gps: ['GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef', 'GPSAltitude',
              'GPSAltitudeRef', 'GPSTimeStamp', 'GPSDateStamp', 'GPSSpeed', 'GPSSpeedRef',
              'GPSTrack', 'GPSTrackRef', 'GPSImgDirection', 'GPSImgDirectionRef',
              'GPSDestLatitude', 'GPSDestLongitude', 'GPSDestLatitudeRef', 'GPSDestLongitudeRef',
              'GPSProcessingMethod', 'GPSAreaInformation', 'GPSVersionID', 'GPSMapDatum',
              'GPSDifferential', 'GPSHPositioningError', 'GPSCoordinates', 'GPSMapLink',
              'latitude', 'longitude', 'GPSPosition'],
              
        advanced: ['ProfileDescription', 'ProfileClass', 'ColorSpaceData', 'ProfileConnectionSpace',
                   'ProfileCreator', 'ProfileCopyright', 'ProfileDateTime', 'RenderingIntent',
                   'MediaWhitePoint', 'ThumbnailOffset', 'ThumbnailLength', 'ThumbnailImage',
                   'Rating', 'RatingPercent', 'Label', 'Title', 'Description', 'Subject',
                   'Creator', 'Rights', 'MetadataDate', 'CreatorTool', 'DocumentID', 'InstanceID',
                   'OriginalDocumentID', 'Headline', 'Caption', 'Keywords', 'City', 'State',
                   'Country', 'CountryCode', 'Location', 'Credit', 'Source', 'CopyrightNotice',
                   'Contact', 'Writer', 'Category', 'SupplementalCategories', 'TransmissionReference',
                   'Urgency', 'ObjectName', 'DateCreated', 'TimeCreated', 'PhotometricInterpretation',
                   'PlanarConfiguration', 'YCbCrSubSampling', 'YCbCrPositioning', 'ComponentsConfiguration',
                   'CompressedBitsPerPixel', 'InteropIndex', 'FlashpixVersion', 'MakerNote',
                   'PrintIM', 'ApplicationNotes', 'PreviewImage', 'ICC_Profile', 'XMP']
    };

    // ================== INITIALIZATION ==================
    function init() {
        bindEvents();
        setupDropzone();
    }

    // ================== EVENT BINDINGS ==================
    function bindEvents() {
        // File inputs
        if (elements.fileInput) elements.fileInput.addEventListener('change', handleFileSelect);
        if (elements.fileInputNew) elements.fileInputNew.addEventListener('change', handleFileSelect);
        
        // Action buttons
        if (elements.btnRemoveMetadata) elements.btnRemoveMetadata.addEventListener('click', removeMetadata);
        if (elements.btnExportJson) elements.btnExportJson.addEventListener('click', exportAsJson);
        if (elements.btnCopyAll) elements.btnCopyAll.addEventListener('click', copyAllMetadata);
        if (elements.btnCopyGps) elements.btnCopyGps.addEventListener('click', copyGpsCoordinates);
        
        // Tabs
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
        
        // Search
        if (elements.metadataSearch) elements.metadataSearch.addEventListener('input', searchMetadata);
    }

    // ================== DROPZONE SETUP ==================
    function setupDropzone() {
        const dropzone = elements.dropzone;
        if (!dropzone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults);
            document.body.addEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'));
        });

        dropzone.addEventListener('drop', handleDrop);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    // ================== FILE HANDLING ==================
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    }

    async function processFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file');
            return;
        }

        currentFile = file;
        currentMetadata = {};
        allRawMetadata = {};
        showLoading(true);

        try {
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            originalImageData = arrayBuffer;

            // Extract basic file info
            extractBasicInfo(file);

            // Create image for dimensions and preview
            const blob = new Blob([arrayBuffer], { type: file.type });
            const imageUrl = URL.createObjectURL(blob);
            
            const img = new Image();
            img.onload = async function() {
                // Add dimensions
                currentMetadata.ImageWidth = img.naturalWidth + ' px';
                currentMetadata.ImageHeight = img.naturalHeight + ' px';
                currentMetadata.ImageSize = `${img.naturalWidth} × ${img.naturalHeight}`;
                currentMetadata.Megapixels = ((img.naturalWidth * img.naturalHeight) / 1000000).toFixed(2) + ' MP';
                
                // Set preview
                if (elements.previewImage) {
                    elements.previewImage.src = imageUrl;
                }

                // Extract ALL metadata using EXIFR
                await extractWithExifr(file);

                // Extract raw binary data
                extractRawBinaryData(arrayBuffer, file.type);

                // Process GPS data
                processGpsData();

                // Update UI
                updateUI();
                showLoading(false);

                // Switch to viewer page
                showPage('viewer');
            };
            img.onerror = function() {
                showLoading(false);
                showToast('Error loading image');
            };
            img.src = imageUrl;

        } catch (error) {
            console.error('Error processing file:', error);
            showLoading(false);
            showToast('Error processing image');
        }
    }

    function extractBasicInfo(file) {
        currentMetadata.FileName = file.name;
        currentMetadata.FileSize = formatFileSize(file.size);
        currentMetadata.FileSizeBytes = file.size + ' bytes';
        currentMetadata.FileType = file.type.split('/')[1]?.toUpperCase() || 'Unknown';
        currentMetadata.MIMEType = file.type;
        currentMetadata.FileModifyDate = formatDate(new Date(file.lastModified));
        currentMetadata.FileExtension = file.name.split('.').pop().toUpperCase();
    }

    // ================== EXIFR EXTRACTION ==================
    async function extractWithExifr(file) {
        try {
            // Check if exifr is available
            if (typeof exifr === 'undefined') {
                console.error('EXIFR library not loaded');
                return;
            }

            // Extract ALL metadata with all segments enabled
            const options = {
                // Enable all segments
                tiff: true,
                exif: true,
                gps: true,
                ifd0: true,
                ifd1: true,
                interop: true,
                iptc: true,
                xmp: true,
                icc: true,
                makerNote: true,
                userComment: true,
                
                // Get everything
                translateKeys: true,
                translateValues: true,
                reviveValues: true,
                sanitize: false,
                mergeOutput: true,
                
                // Parse all tags
                pick: null,
                skip: []
            };

            // Try full parse first
            let fullData = null;
            try {
                fullData = await exifr.parse(file, options);
            } catch (e) {
                console.log('Full parse failed, trying basic:', e);
            }

            if (fullData) {
                // Merge all extracted data
                Object.keys(fullData).forEach(key => {
                    const value = fullData[key];
                    if (value !== undefined && value !== null && value !== '') {
                        // Skip binary/buffer data
                        if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
                            currentMetadata[key] = '[Binary Data]';
                        } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                            // Handle nested objects
                            currentMetadata[key] = JSON.stringify(value);
                        } else {
                            currentMetadata[key] = value;
                        }
                        allRawMetadata[key] = value;
                    }
                });
            }

            // Also try to get GPS separately for better accuracy
            try {
                const gpsData = await exifr.gps(file);
                if (gpsData) {
                    if (gpsData.latitude !== undefined) {
                        currentMetadata.latitude = gpsData.latitude;
                        currentMetadata.GPSLatitudeDecimal = gpsData.latitude.toFixed(6);
                    }
                    if (gpsData.longitude !== undefined) {
                        currentMetadata.longitude = gpsData.longitude;
                        currentMetadata.GPSLongitudeDecimal = gpsData.longitude.toFixed(6);
                    }
                }
            } catch (e) {
                console.log('GPS extraction note:', e.message);
            }

            // Try to get thumbnail info
            try {
                const thumbBuffer = await exifr.thumbnail(file);
                if (thumbBuffer) {
                    currentMetadata.ThumbnailImage = 'Yes (' + formatFileSize(thumbBuffer.byteLength) + ')';
                }
            } catch (e) {
                // No thumbnail
            }

            // Try to get orientation
            try {
                const orientation = await exifr.orientation(file);
                if (orientation) {
                    currentMetadata.OrientationValue = orientation;
                }
            } catch (e) {
                // No orientation
            }

        } catch (error) {
            console.error('EXIFR extraction error:', error);
        }
    }

    // ================== RAW BINARY EXTRACTION ==================
    function extractRawBinaryData(arrayBuffer, mimeType) {
        try {
            const dataView = new DataView(arrayBuffer);
            const firstBytes = dataView.getUint16(0);

            // JPEG
            if (firstBytes === 0xFFD8) {
                currentMetadata.FileFormat = 'JPEG';
                extractJpegInfo(dataView);
            }
            // PNG
            else if (dataView.getUint32(0) === 0x89504E47) {
                currentMetadata.FileFormat = 'PNG';
                extractPngInfo(dataView);
            }
            // WebP
            else if (dataView.getUint32(0) === 0x52494646) {
                const webp = dataView.getUint32(8);
                if (webp === 0x57454250) {
                    currentMetadata.FileFormat = 'WebP';
                    extractWebPInfo(dataView);
                }
            }
            // GIF
            else if (String.fromCharCode(dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2)) === 'GIF') {
                currentMetadata.FileFormat = 'GIF';
                extractGifInfo(dataView);
            }
            // BMP
            else if (dataView.getUint16(0) === 0x424D) {
                currentMetadata.FileFormat = 'BMP';
                extractBmpInfo(dataView);
            }
            // TIFF
            else if (firstBytes === 0x4949 || firstBytes === 0x4D4D) {
                currentMetadata.FileFormat = 'TIFF';
                currentMetadata.ByteOrder = firstBytes === 0x4949 ? 'Little-endian (Intel)' : 'Big-endian (Motorola)';
            }

        } catch (error) {
            console.log('Binary extraction error:', error);
        }
    }

    function extractJpegInfo(dataView) {
        let offset = 2;
        const length = dataView.byteLength;
        
        while (offset < length - 4) {
            try {
                if (dataView.getUint8(offset) !== 0xFF) break;
                
                const marker = dataView.getUint8(offset + 1);
                const segmentLength = dataView.getUint16(offset + 2);
                
                // APP0 - JFIF
                if (marker === 0xE0 && segmentLength >= 14) {
                    try {
                        const identifier = String.fromCharCode(
                            dataView.getUint8(offset + 4),
                            dataView.getUint8(offset + 5),
                            dataView.getUint8(offset + 6),
                            dataView.getUint8(offset + 7)
                        );
                        if (identifier === 'JFIF') {
                            const major = dataView.getUint8(offset + 9);
                            const minor = dataView.getUint8(offset + 10);
                            currentMetadata.JFIFVersion = `${major}.${minor < 10 ? '0' : ''}${minor}`;
                            
                            const units = dataView.getUint8(offset + 11);
                            currentMetadata.JFIFUnits = units === 0 ? 'Aspect ratio' : units === 1 ? 'Dots per inch' : 'Dots per cm';
                            
                            currentMetadata.JFIFXDensity = dataView.getUint16(offset + 12);
                            currentMetadata.JFIFYDensity = dataView.getUint16(offset + 14);
                        }
                    } catch (e) {}
                }
                
                // SOF markers - Frame info
                if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
                    try {
                        const precision = dataView.getUint8(offset + 4);
                        const height = dataView.getUint16(offset + 5);
                        const width = dataView.getUint16(offset + 7);
                        const components = dataView.getUint8(offset + 9);
                        
                        currentMetadata.JPEGPrecision = precision + ' bits';
                        currentMetadata.ColorComponents = components + (components === 1 ? ' (Grayscale)' : components === 3 ? ' (RGB/YCbCr)' : components === 4 ? ' (CMYK)' : '');
                        
                        const compressionTypes = {
                            0xC0: 'Baseline DCT',
                            0xC1: 'Extended Sequential DCT',
                            0xC2: 'Progressive DCT',
                            0xC3: 'Lossless (Sequential)',
                            0xC5: 'Differential Sequential DCT',
                            0xC6: 'Differential Progressive DCT',
                            0xC7: 'Differential Lossless',
                            0xC9: 'Extended Sequential DCT, Arithmetic',
                            0xCA: 'Progressive DCT, Arithmetic',
                            0xCB: 'Lossless (Sequential), Arithmetic',
                            0xCD: 'Differential Sequential DCT, Arithmetic',
                            0xCE: 'Differential Progressive DCT, Arithmetic',
                            0xCF: 'Differential Lossless, Arithmetic'
                        };
                        currentMetadata.JPEGCompression = compressionTypes[marker] || 'Unknown';
                    } catch (e) {}
                }
                
                // DQT - Quantization Table
                if (marker === 0xDB) {
                    currentMetadata.HasQuantizationTable = 'Yes';
                }
                
                // DHT - Huffman Table
                if (marker === 0xC4) {
                    currentMetadata.HasHuffmanTable = 'Yes';
                }
                
                // DRI - Restart Interval
                if (marker === 0xDD) {
                    const restartInterval = dataView.getUint16(offset + 4);
                    currentMetadata.RestartInterval = restartInterval + ' MCUs';
                }
                
                // Stop at SOS or EOI
                if (marker === 0xDA || marker === 0xD9) break;
                
                offset += segmentLength + 2;
            } catch (e) {
                break;
            }
        }
    }

    function extractPngInfo(dataView) {
        try {
            // IHDR chunk starts at byte 8 (after signature)
            const ihdrLength = dataView.getUint32(8);
            const ihdrType = dataView.getUint32(12);
            
            // 0x49484452 = 'IHDR'
            if (ihdrType === 0x49484452) {
                const width = dataView.getUint32(16);
                const height = dataView.getUint32(20);
                const bitDepth = dataView.getUint8(24);
                const colorType = dataView.getUint8(25);
                const compression = dataView.getUint8(26);
                const filter = dataView.getUint8(27);
                const interlace = dataView.getUint8(28);
                
                currentMetadata.PNGBitDepth = bitDepth + ' bits per channel';
                
                const colorTypes = {
                    0: 'Grayscale',
                    2: 'RGB (Truecolor)',
                    3: 'Indexed (Palette)',
                    4: 'Grayscale with Alpha',
                    6: 'RGBA (Truecolor with Alpha)'
                };
                currentMetadata.PNGColorType = colorTypes[colorType] || 'Unknown';
                currentMetadata.HasAlpha = (colorType === 4 || colorType === 6) ? 'Yes' : 'No';
                
                const bitsPerPixel = colorType === 0 ? bitDepth : 
                                     colorType === 2 ? bitDepth * 3 :
                                     colorType === 3 ? bitDepth :
                                     colorType === 4 ? bitDepth * 2 :
                                     colorType === 6 ? bitDepth * 4 : bitDepth;
                currentMetadata.BitsPerPixel = bitsPerPixel + ' bits';
                
                currentMetadata.PNGCompression = compression === 0 ? 'Deflate/Inflate' : 'Unknown';
                currentMetadata.PNGFilter = filter === 0 ? 'Adaptive (5 filter types)' : 'Unknown';
                currentMetadata.PNGInterlace = interlace === 0 ? 'None (Progressive display)' : interlace === 1 ? 'Adam7 interlace' : 'Unknown';
            }
            
            // Scan for other chunks
            let offset = 8;
            while (offset < dataView.byteLength - 12) {
                try {
                    const chunkLength = dataView.getUint32(offset);
                    const chunkType = String.fromCharCode(
                        dataView.getUint8(offset + 4),
                        dataView.getUint8(offset + 5),
                        dataView.getUint8(offset + 6),
                        dataView.getUint8(offset + 7)
                    );
                    
                    if (chunkType === 'gAMA') {
                        const gamma = dataView.getUint32(offset + 8) / 100000;
                        currentMetadata.PNGGamma = gamma.toFixed(5);
                    }
                    if (chunkType === 'cHRM') {
                        currentMetadata.PNGChromaticity = 'Present';
                    }
                    if (chunkType === 'sRGB') {
                        const intent = dataView.getUint8(offset + 8);
                        const intents = ['Perceptual', 'Relative colorimetric', 'Saturation', 'Absolute colorimetric'];
                        currentMetadata.PNGsRGB = intents[intent] || 'Yes';
                    }
                    if (chunkType === 'iCCP') {
                        currentMetadata.PNGICCProfile = 'Present';
                    }
                    if (chunkType === 'tEXt' || chunkType === 'iTXt' || chunkType === 'zTXt') {
                        currentMetadata.PNGTextChunks = (currentMetadata.PNGTextChunks || 0) + 1;
                    }
                    if (chunkType === 'pHYs') {
                        const pX = dataView.getUint32(offset + 8);
                        const pY = dataView.getUint32(offset + 12);
                        const unit = dataView.getUint8(offset + 16);
                        if (unit === 1) {
                            // Meters to DPI
                            currentMetadata.PNGXResolution = Math.round(pX / 39.3701) + ' DPI';
                            currentMetadata.PNGYResolution = Math.round(pY / 39.3701) + ' DPI';
                        } else {
                            currentMetadata.PNGPixelAspectRatio = (pX / pY).toFixed(4);
                        }
                    }
                    if (chunkType === 'tIME') {
                        const year = dataView.getUint16(offset + 8);
                        const month = dataView.getUint8(offset + 10);
                        const day = dataView.getUint8(offset + 11);
                        const hour = dataView.getUint8(offset + 12);
                        const minute = dataView.getUint8(offset + 13);
                        const second = dataView.getUint8(offset + 14);
                        currentMetadata.PNGModificationTime = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}`;
                    }
                    if (chunkType === 'IEND') break;
                    
                    offset += chunkLength + 12;
                } catch (e) {
                    break;
                }
            }
        } catch (error) {
            console.log('PNG extraction error:', error);
        }
    }

    function extractWebPInfo(dataView) {
        try {
            const fileSize = dataView.getUint32(4, true);
            currentMetadata.WebPFileSize = formatFileSize(fileSize + 8);
            
            // Check VP8 type at offset 12
            const chunkType = String.fromCharCode(
                dataView.getUint8(12),
                dataView.getUint8(13),
                dataView.getUint8(14),
                dataView.getUint8(15)
            );
            
            if (chunkType === 'VP8 ') {
                currentMetadata.WebPFormat = 'Lossy (VP8)';
            } else if (chunkType === 'VP8L') {
                currentMetadata.WebPFormat = 'Lossless (VP8L)';
            } else if (chunkType === 'VP8X') {
                currentMetadata.WebPFormat = 'Extended (VP8X)';
                // Parse extended features
                const flags = dataView.getUint8(20);
                currentMetadata.WebPHasICC = (flags & 0x20) ? 'Yes' : 'No';
                currentMetadata.WebPHasAlpha = (flags & 0x10) ? 'Yes' : 'No';
                currentMetadata.WebPHasEXIF = (flags & 0x08) ? 'Yes' : 'No';
                currentMetadata.WebPHasXMP = (flags & 0x04) ? 'Yes' : 'No';
                currentMetadata.WebPHasAnimation = (flags & 0x02) ? 'Yes' : 'No';
            }
        } catch (e) {
            console.log('WebP extraction error:', e);
        }
    }

    function extractGifInfo(dataView) {
        try {
            const version = String.fromCharCode(
                dataView.getUint8(3),
                dataView.getUint8(4),
                dataView.getUint8(5)
            );
            currentMetadata.GIFVersion = 'GIF' + version;
            
            const width = dataView.getUint16(6, true);
            const height = dataView.getUint16(8, true);
            const packed = dataView.getUint8(10);
            
            const hasGlobalColorTable = (packed & 0x80) !== 0;
            const colorResolution = ((packed & 0x70) >> 4) + 1;
            const sortFlag = (packed & 0x08) !== 0;
            const globalColorTableSize = 2 << (packed & 0x07);
            
            currentMetadata.GIFHasGlobalColorTable = hasGlobalColorTable ? 'Yes' : 'No';
            currentMetadata.GIFColorResolution = colorResolution + ' bits';
            currentMetadata.GIFColorTableSize = globalColorTableSize + ' colors';
            currentMetadata.GIFBackgroundColor = dataView.getUint8(11);
            
            const aspectRatio = dataView.getUint8(12);
            if (aspectRatio !== 0) {
                currentMetadata.GIFPixelAspectRatio = ((aspectRatio + 15) / 64).toFixed(4);
            }
        } catch (e) {
            console.log('GIF extraction error:', e);
        }
    }

    function extractBmpInfo(dataView) {
        try {
            currentMetadata.BMPFileSize = formatFileSize(dataView.getUint32(2, true));
            currentMetadata.BMPDataOffset = dataView.getUint32(10, true) + ' bytes';
            
            const headerSize = dataView.getUint32(14, true);
            currentMetadata.BMPHeaderSize = headerSize + ' bytes';
            
            if (headerSize >= 40) {
                const width = dataView.getInt32(18, true);
                const height = dataView.getInt32(22, true);
                const planes = dataView.getUint16(26, true);
                const bitsPerPixel = dataView.getUint16(28, true);
                const compression = dataView.getUint32(30, true);
                
                currentMetadata.BMPWidth = Math.abs(width) + ' px';
                currentMetadata.BMPHeight = Math.abs(height) + ' px';
                currentMetadata.BMPTopDown = height < 0 ? 'Yes' : 'No';
                currentMetadata.BMPBitsPerPixel = bitsPerPixel + ' bits';
                
                const compressionTypes = {
                    0: 'None (BI_RGB)',
                    1: 'RLE8 (BI_RLE8)',
                    2: 'RLE4 (BI_RLE4)',
                    3: 'Bitfields (BI_BITFIELDS)',
                    4: 'JPEG (BI_JPEG)',
                    5: 'PNG (BI_PNG)'
                };
                currentMetadata.BMPCompression = compressionTypes[compression] || 'Unknown';
                
                if (headerSize >= 40) {
                    const xPelsPerMeter = dataView.getInt32(38, true);
                    const yPelsPerMeter = dataView.getInt32(42, true);
                    if (xPelsPerMeter > 0) {
                        currentMetadata.BMPXResolution = Math.round(xPelsPerMeter / 39.3701) + ' DPI';
                    }
                    if (yPelsPerMeter > 0) {
                        currentMetadata.BMPYResolution = Math.round(yPelsPerMeter / 39.3701) + ' DPI';
                    }
                    currentMetadata.BMPColorsUsed = dataView.getUint32(46, true) || 'Default';
                    currentMetadata.BMPImportantColors = dataView.getUint32(50, true) || 'All';
                }
            }
        } catch (e) {
            console.log('BMP extraction error:', e);
        }
    }

    // ================== GPS PROCESSING ==================
    function processGpsData() {
        // Try multiple sources for GPS data
        let lat = currentMetadata.GPSLatitudeDecimal || currentMetadata.latitude;
        let lng = currentMetadata.GPSLongitudeDecimal || currentMetadata.longitude;

        // Convert from DMS if needed
        if (!lat && currentMetadata.GPSLatitude) {
            lat = convertGpsToDecimal(currentMetadata.GPSLatitude, currentMetadata.GPSLatitudeRef);
        }
        if (!lng && currentMetadata.GPSLongitude) {
            lng = convertGpsToDecimal(currentMetadata.GPSLongitude, currentMetadata.GPSLongitudeRef);
        }

        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);
            
            currentMetadata.GPSLatitudeDecimal = latNum.toFixed(6);
            currentMetadata.GPSLongitudeDecimal = lngNum.toFixed(6);
            currentMetadata.GPSCoordinates = `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`;
            currentMetadata.GPSMapLink = `https://www.google.com/maps?q=${latNum},${lngNum}`;
        }

        // Format altitude
        if (currentMetadata.GPSAltitude !== undefined) {
            let alt = currentMetadata.GPSAltitude;
            if (typeof alt === 'number') {
                const altRef = currentMetadata.GPSAltitudeRef;
                if (altRef === 1 || altRef === '1' || altRef === 'Below Sea Level') {
                    alt = -alt;
                }
                currentMetadata.GPSAltitudeFormatted = alt.toFixed(1) + ' meters';
            }
        }
    }

    function convertGpsToDecimal(coord, ref) {
        if (coord === undefined || coord === null) return null;
        
        let degrees, minutes, seconds;
        
        if (Array.isArray(coord)) {
            degrees = coord[0];
            minutes = coord[1] || 0;
            seconds = coord[2] || 0;
        } else if (typeof coord === 'number') {
            return coord;
        } else if (typeof coord === 'string') {
            const match = coord.match(/(\d+)[°\s]+(\d+)['\s]+(\d+\.?\d*)/);
            if (match) {
                degrees = parseFloat(match[1]);
                minutes = parseFloat(match[2]);
                seconds = parseFloat(match[3]);
            } else {
                return parseFloat(coord);
            }
        }
        
        if (degrees === undefined) return null;
        
        let decimal = degrees + (minutes / 60) + (seconds / 3600);
        
        if (ref === 'S' || ref === 'W' || ref === 'South' || ref === 'West') {
            decimal = -decimal;
        }
        
        return decimal;
    }

    // ================== UI UPDATE ==================
    function updateUI() {
        // Update file info
        if (elements.fileName) elements.fileName.textContent = currentMetadata.FileName || 'Unknown';
        if (elements.fileSize) elements.fileSize.textContent = currentMetadata.FileSize || '0 KB';
        if (elements.fileDimensions) elements.fileDimensions.textContent = currentMetadata.ImageSize || '0 × 0';
        if (elements.fileType) elements.fileType.textContent = currentMetadata.FileType || 'Unknown';
        
        // Update stats
        updateStats();
        
        // Update GPS map
        updateGpsSection();
        
        // Populate metadata tables
        populateMetadataTables();
    }

    function updateStats() {
        // Camera
        const make = currentMetadata.Make || '';
        const model = currentMetadata.Model || '';
        if (elements.statCamera) elements.statCamera.textContent = (make + ' ' + model).trim() || '-';
        
        // Date
        const dateOriginal = currentMetadata.DateTimeOriginal || currentMetadata.CreateDate || currentMetadata.DateTime || currentMetadata.ModifyDate;
        if (elements.statDate) elements.statDate.textContent = dateOriginal ? formatExifDate(dateOriginal) : '-';
        
        // Lens
        if (elements.statLens) elements.statLens.textContent = currentMetadata.LensModel || currentMetadata.Lens || currentMetadata.LensInfo || '-';
        
        // Settings
        const fNumber = currentMetadata.FNumber ? (typeof currentMetadata.FNumber === 'number' ? `f/${currentMetadata.FNumber}` : currentMetadata.FNumber) : '';
        const exposure = currentMetadata.ExposureTime ? formatExposure(currentMetadata.ExposureTime) : '';
        const iso = currentMetadata.ISO || currentMetadata.ISOSpeedRatings || '';
        const focalLength = currentMetadata.FocalLength ? (typeof currentMetadata.FocalLength === 'number' ? `${currentMetadata.FocalLength}mm` : currentMetadata.FocalLength) : '';
        
        const settingsParts = [fNumber, exposure, iso ? `ISO ${iso}` : '', focalLength].filter(Boolean);
        if (elements.statSettings) elements.statSettings.textContent = settingsParts.join(' • ') || '-';
    }

    function updateGpsSection() {
        const lat = currentMetadata.GPSLatitudeDecimal;
        const lng = currentMetadata.GPSLongitudeDecimal;
        
        if (lat && lng && elements.mapSection) {
            elements.mapSection.style.display = 'block';
            if (elements.gpsLat) elements.gpsLat.textContent = lat + '°';
            if (elements.gpsLng) elements.gpsLng.textContent = lng + '°';
            if (elements.gpsAlt) elements.gpsAlt.textContent = currentMetadata.GPSAltitudeFormatted || '-';
            
            // Load OpenStreetMap
            const latNum = parseFloat(lat);
            const lngNum = parseFloat(lng);
            const bbox = `${lngNum - 0.005}%2C${latNum - 0.005}%2C${lngNum + 0.005}%2C${latNum + 0.005}`;
            const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latNum}%2C${lngNum}`;
            if (elements.gpsMap) elements.gpsMap.src = mapUrl;
        } else if (elements.mapSection) {
            elements.mapSection.style.display = 'none';
        }
    }

    function populateMetadataTables() {
        // Clear all tables
        if (elements.tableBasic) elements.tableBasic.innerHTML = '';
        if (elements.tableCamera) elements.tableCamera.innerHTML = '';
        if (elements.tableExif) elements.tableExif.innerHTML = '';
        if (elements.tableGps) elements.tableGps.innerHTML = '';
        if (elements.tableAdvanced) elements.tableAdvanced.innerHTML = '';
        
        const counts = { basic: 0, camera: 0, exif: 0, gps: 0, advanced: 0 };
        let totalCount = 0;
        const processed = new Set();
        
        // Categorize and display all metadata
        Object.keys(currentMetadata).forEach(key => {
            if (processed.has(key)) return;
            
            const value = currentMetadata[key];
            if (value === undefined || value === null || value === '' || value === '[Binary Data]') return;
            
            const category = determineCategory(key);
            const table = elements[`table${category.charAt(0).toUpperCase() + category.slice(1)}`];
            
            if (table) {
                const formattedValue = formatValue(key, value);
                const row = createMetadataRow(key, formattedValue);
                table.appendChild(row);
                counts[category]++;
                totalCount++;
                processed.add(key);
            }
        });
        
        // Update counts
        if (elements.countBasic) elements.countBasic.textContent = `${counts.basic} fields`;
        if (elements.countCamera) elements.countCamera.textContent = `${counts.camera} fields`;
        if (elements.countExif) elements.countExif.textContent = `${counts.exif} fields`;
        if (elements.countGps) elements.countGps.textContent = `${counts.gps} fields`;
        if (elements.countAdvanced) elements.countAdvanced.textContent = `${counts.advanced} fields`;
        if (elements.totalFields) elements.totalFields.textContent = `${totalCount} metadata fields extracted`;
        
        // Show/hide empty groups
        elements.metadataGroups.forEach(group => {
            const table = group.querySelector('.metadata-table');
            group.style.display = (table && table.children.length > 0) ? 'block' : 'none';
        });
    }

    function determineCategory(key) {
        const keyLower = key.toLowerCase();
        
        // Check each category
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(k => k.toLowerCase() === keyLower)) {
                return category;
            }
        }
        
        // Pattern matching
        if (keyLower.includes('gps') || keyLower === 'latitude' || keyLower === 'longitude') return 'gps';
        if (keyLower.includes('lens') || keyLower.includes('camera') || keyLower.includes('make') || keyLower.includes('model') || keyLower.includes('serial')) return 'camera';
        if (keyLower.includes('exposure') || keyLower.includes('flash') || keyLower.includes('focal') || keyLower.includes('iso') || keyLower.includes('aperture') || keyLower.includes('shutter') || keyLower.includes('white') || keyLower.includes('meter')) return 'exif';
        if (keyLower.includes('file') || keyLower.includes('image') && (keyLower.includes('width') || keyLower.includes('height') || keyLower.includes('size'))) return 'basic';
        if (keyLower.includes('png') || keyLower.includes('jpeg') || keyLower.includes('jfif') || keyLower.includes('gif') || keyLower.includes('bmp') || keyLower.includes('webp')) return 'basic';
        if (keyLower.includes('date') || keyLower.includes('time')) return 'exif';
        
        return 'advanced';
    }

    function createMetadataRow(key, value) {
        const row = document.createElement('div');
        row.className = 'metadata-row';
        row.dataset.key = key.toLowerCase();
        row.dataset.value = String(value).toLowerCase();
        
        const friendlyName = FRIENDLY_NAMES[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        
        // Check if sensitive
        const sensitivePatterns = ['serial', 'gpslatitude', 'gpslongitude', 'latitude', 'longitude', 'owner', 'author', 'artist'];
        const isSensitive = sensitivePatterns.some(p => key.toLowerCase().includes(p));
        
        const displayValue = escapeHtml(String(value));
        
        row.innerHTML = `
            <span class="metadata-key">${escapeHtml(friendlyName)}</span>
            <span class="metadata-value ${isSensitive ? 'sensitive' : ''}">${displayValue}</span>
            <button class="copy-btn" title="Copy value">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
            </button>
        `;
        
        // Add click handler for copy button
        row.querySelector('.copy-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(String(value)).then(() => {
                showToast('Copied!');
            });
        });
        
        return row;
    }

    function formatValue(key, value) {
        // Check for mapped values
        if (EXIF_MAPPINGS[key] && EXIF_MAPPINGS[key][value] !== undefined) {
            return EXIF_MAPPINGS[key][value];
        }
        
        // Handle Date objects
        if (value instanceof Date) {
            return formatExifDate(value);
        }
        
        // Format specific types
        if (key === 'ExposureTime' || key === 'ShutterSpeedValue') {
            return formatExposure(value);
        }
        
        if (key === 'FNumber' || key === 'ApertureValue') {
            if (typeof value === 'number') {
                return 'f/' + value.toFixed(1);
            }
        }
        
        if (key === 'FocalLength') {
            if (typeof value === 'number') {
                return value + ' mm';
            }
        }
        
        if (key === 'FocalLengthIn35mmFormat') {
            if (typeof value === 'number') {
                return value + ' mm (35mm equiv.)';
            }
        }
        
        if ((key === 'XResolution' || key === 'YResolution') && typeof value === 'number') {
            return value + ' dpi';
        }
        
        if (key === 'ExposureCompensation' || key === 'ExposureBiasValue') {
            if (typeof value === 'number') {
                return (value >= 0 ? '+' : '') + value.toFixed(2) + ' EV';
            }
        }
        
        // Handle arrays
        if (Array.isArray(value)) {
            return value.map(v => formatValue(key, v)).join(', ');
        }
        
        return value;
    }

    function formatExposure(value) {
        if (typeof value === 'number') {
            if (value < 1) {
                const denom = Math.round(1 / value);
                return `1/${denom}s`;
            }
            return value + 's';
        }
        return value;
    }

    function formatExifDate(dateVal) {
        if (!dateVal) return '-';
        
        if (dateVal instanceof Date) {
            return dateVal.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
        
        // EXIF date format: "YYYY:MM:DD HH:MM:SS"
        const str = String(dateVal);
        const match = str.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (match) {
            const date = new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6]);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return str;
    }

    // ================== TAB SWITCHING ==================
    function switchTab(tab) {
        elements.tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        elements.metadataGroups.forEach(group => {
            const categories = group.dataset.category.split(' ');
            const table = group.querySelector('.metadata-table');
            
            if (table && table.children.length > 0) {
                if (tab === 'all' || categories.includes(tab)) {
                    group.classList.remove('hidden');
                } else {
                    group.classList.add('hidden');
                }
            }
        });
    }

    // ================== SEARCH ==================
    function searchMetadata() {
        const query = elements.metadataSearch.value.toLowerCase().trim();
        const rows = document.querySelectorAll('.metadata-row');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const key = row.dataset.key || '';
            const value = row.dataset.value || '';
            
            if (query === '' || key.includes(query) || value.includes(query)) {
                row.classList.remove('hidden');
                visibleCount++;
            } else {
                row.classList.add('hidden');
            }
        });
        
        if (elements.searchCount) elements.searchCount.textContent = query ? `${visibleCount} found` : '';
        
        // Show/hide empty groups
        elements.metadataGroups.forEach(group => {
            const table = group.querySelector('.metadata-table');
            if (table) {
                const visibleRows = table.querySelectorAll('.metadata-row:not(.hidden)');
                group.style.display = visibleRows.length > 0 ? 'block' : 'none';
            }
        });
    }

    // ================== ACTIONS ==================
    function removeMetadata() {
        if (!currentFile || !originalImageData) {
            showToast('No image loaded');
            return;
        }
        
        showLoading(true);
        
        const blob = new Blob([originalImageData], { type: currentFile.type });
        const img = new Image();
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            let mimeType = 'image/jpeg';
            let quality = 0.95;
            
            if (currentFile.type === 'image/png') {
                mimeType = 'image/png';
            } else if (currentFile.type === 'image/webp') {
                mimeType = 'image/webp';
            }
            
            canvas.toBlob(function(newBlob) {
                const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
                const extension = currentFile.name.split('.').pop();
                const newName = `${baseName}_clean.${extension}`;
                
                const url = URL.createObjectURL(newBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = newName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showLoading(false);
                showToast('✓ Metadata removed! Clean image downloaded.');
            }, mimeType, quality);
        };
        
        img.onerror = function() {
            showLoading(false);
            showToast('Error processing image');
        };
        
        img.src = URL.createObjectURL(blob);
    }

    function exportAsJson() {
        if (Object.keys(currentMetadata).length === 0) {
            showToast('No metadata to export');
            return;
        }
        
        const exportData = {};
        Object.keys(currentMetadata).forEach(key => {
            const value = currentMetadata[key];
            if (value instanceof Date) {
                exportData[key] = value.toISOString();
            } else if (typeof value !== 'function') {
                exportData[key] = value;
            }
        });
        
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_metadata.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('✓ Metadata exported as JSON');
    }

    function copyAllMetadata() {
        if (Object.keys(currentMetadata).length === 0) {
            showToast('No metadata to copy');
            return;
        }
        
        let text = `Image Metadata: ${currentFile.name}\n`;
        text += '═'.repeat(50) + '\n\n';
        
        Object.keys(currentMetadata).forEach(key => {
            const friendlyName = FRIENDLY_NAMES[key] || key;
            const value = formatValue(key, currentMetadata[key]);
            if (value !== '[Binary Data]' && value !== undefined) {
                text += `${friendlyName}: ${value}\n`;
            }
        });
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('✓ All metadata copied to clipboard');
        }).catch(() => {
            showToast('Failed to copy');
        });
    }

    function copyGpsCoordinates() {
        const lat = currentMetadata.GPSLatitudeDecimal;
        const lng = currentMetadata.GPSLongitudeDecimal;
        
        if (lat && lng) {
            navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => {
                showToast('✓ GPS coordinates copied');
            });
        } else {
            showToast('No GPS data available');
        }
    }

    // ================== PAGE NAVIGATION ==================
    function showPage(page) {
        if (elements.pageUpload) elements.pageUpload.classList.remove('active');
        if (elements.pageViewer) elements.pageViewer.classList.remove('active');
        
        if (page === 'upload') {
            if (elements.pageUpload) elements.pageUpload.classList.add('active');
            if (elements.infoSection) elements.infoSection.style.display = 'block';
        } else if (page === 'viewer') {
            if (elements.pageViewer) elements.pageViewer.classList.add('active');
            if (elements.infoSection) elements.infoSection.style.display = 'none';
        }
    }

    // ================== UTILITIES ==================
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(date) {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showLoading(show) {
        let overlay = document.querySelector('.loading-overlay');
        
        if (!overlay && show) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-text">Extracting all metadata...</div>
            `;
            document.body.appendChild(overlay);
        }
        
        if (overlay) {
            if (show) {
                setTimeout(() => overlay.classList.add('show'), 10);
            } else {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            }
        }
    }

    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ================== INITIALIZE ==================
    document.addEventListener('DOMContentLoaded', init);
})();
