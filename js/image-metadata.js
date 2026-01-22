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
    let elements = {}; // Will be populated after DOM ready

    // ================== FRIENDLY NAMES MAPPING ==================
    const FRIENDLY_NAMES = {
        'ImageWidth': 'Image Width',
        'ImageHeight': 'Image Height',
        'ImageSize': 'Image Size',
        'Megapixels': 'Megapixels',
        'BitDepth': 'Bit Depth',
        'ColorType': 'Color Type',
        'BitsPerSample': 'Bits Per Sample',
        'SamplesPerPixel': 'Samples Per Pixel',
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
        'Software': 'Software',
        'ProcessingSoftware': 'Processing Software',
        'Artist': 'Artist/Photographer',
        'Copyright': 'Copyright',
        'ImageDescription': 'Image Description',
        'UserComment': 'User Comment',
        'OwnerName': 'Owner Name',
        'CameraOwnerName': 'Camera Owner',
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
        'Flash': 'Flash',
        'FlashMode': 'Flash Mode',
        'FocalLength': 'Focal Length',
        'FocalLengthIn35mmFormat': 'Focal Length (35mm)',
        'FocalPlaneXResolution': 'Focal Plane X Resolution',
        'FocalPlaneYResolution': 'Focal Plane Y Resolution',
        'SubjectDistance': 'Subject Distance',
        'SubjectDistanceRange': 'Subject Distance Range',
        'MaxApertureValue': 'Max Aperture',
        'FocusMode': 'Focus Mode',
        'WhiteBalance': 'White Balance',
        'ColorSpace': 'Color Space',
        'Contrast': 'Contrast',
        'Saturation': 'Saturation',
        'Sharpness': 'Sharpness',
        'DigitalZoomRatio': 'Digital Zoom',
        'SceneCaptureType': 'Scene Capture Type',
        'SceneType': 'Scene Type',
        'GainControl': 'Gain Control',
        'DateTimeOriginal': 'Date Taken',
        'CreateDate': 'Date Created',
        'ModifyDate': 'Date Modified',
        'DateTime': 'Date/Time',
        'DateTimeDigitized': 'Date Digitized',
        'GPSLatitude': 'GPS Latitude',
        'GPSLongitude': 'GPS Longitude',
        'GPSLatitudeRef': 'GPS Latitude Ref',
        'GPSLongitudeRef': 'GPS Longitude Ref',
        'GPSAltitude': 'GPS Altitude',
        'GPSAltitudeRef': 'GPS Altitude Ref',
        'GPSTimeStamp': 'GPS Time',
        'GPSDateStamp': 'GPS Date',
        'GPSSpeed': 'GPS Speed',
        'GPSImgDirection': 'GPS Image Direction',
        'latitude': 'Latitude (Decimal)',
        'longitude': 'Longitude (Decimal)',
        'Orientation': 'Orientation',
        'XResolution': 'X Resolution (DPI)',
        'YResolution': 'Y Resolution (DPI)',
        'ResolutionUnit': 'Resolution Unit',
        'Compression': 'Compression',
        'ExifVersion': 'EXIF Version',
        'ExifImageWidth': 'EXIF Image Width',
        'ExifImageHeight': 'EXIF Image Height',
        'PixelXDimension': 'Pixel X Dimension',
        'PixelYDimension': 'Pixel Y Dimension',
        'ImageUniqueID': 'Image Unique ID',
        'SensingMethod': 'Sensing Method',
        'FileSource': 'File Source',
        'CustomRendered': 'Custom Rendered',
        'ThumbnailImage': 'Thumbnail Present',
        'Rating': 'Rating',
        'Title': 'Title',
        'Description': 'Description',
        'Subject': 'Subject/Keywords',
        'Creator': 'Creator',
        'Rights': 'Rights',
        'CreatorTool': 'Creator Tool',
        'Headline': 'Headline',
        'Caption': 'Caption',
        'Keywords': 'Keywords',
        'City': 'City',
        'State': 'State/Province',
        'Country': 'Country',
        'ProfileDescription': 'ICC Profile Description',
        'ShutterCount': 'Shutter Count',
        'ImageStabilization': 'Image Stabilization',
        'Quality': 'Quality Setting'
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
            16: 'Flash Did Not Fire, Compulsory',
            24: 'Flash Did Not Fire, Auto',
            25: 'Flash Fired, Auto',
            32: 'No Flash Function'
        },
        WhiteBalance: {
            0: 'Auto',
            1: 'Manual'
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
            3: 'Night Scene'
        },
        ResolutionUnit: {
            1: 'None',
            2: 'inches',
            3: 'centimeters'
        },
        Contrast: { 0: 'Normal', 1: 'Low', 2: 'High' },
        Saturation: { 0: 'Normal', 1: 'Low', 2: 'High' },
        Sharpness: { 0: 'Normal', 1: 'Soft', 2: 'Hard' }
    };

    // ================== CATEGORY DEFINITIONS ==================
    const CATEGORY_KEYWORDS = {
        basic: ['FileName', 'FileSize', 'FileType', 'MIMEType', 'ImageWidth', 'ImageHeight', 'ImageSize', 
                'Megapixels', 'BitDepth', 'ColorType', 'BitsPerSample', 'SamplesPerPixel', 'Compression',
                'FileFormat', 'FileExtension', 'FileSizeBytes', 'FileModifyDate', 'JFIFVersion', 'JFIFUnits',
                'PNGBitDepth', 'PNGColorType', 'PNGCompression', 'PNGInterlace', 'HasAlpha', 'ColorComponents',
                'JPEGCompression', 'Width', 'Height', 'PixelWidth', 'PixelHeight', 'BitsPerPixel'],
                
        camera: ['Make', 'Model', 'LensMake', 'LensModel', 'LensInfo', 'Lens', 'LensSerialNumber',
                 'SerialNumber', 'InternalSerialNumber', 'BodySerialNumber', 'CameraSerialNumber',
                 'Software', 'ProcessingSoftware', 'HostComputer', 'Artist', 'Copyright', 'OwnerName',
                 'CameraOwnerName', 'ImageDescription', 'UserComment', 'UniqueCameraModel', 'FirmwareVersion'],
                 
        exif: ['ExposureTime', 'ShutterSpeedValue', 'FNumber', 'ApertureValue', 'ISO', 'ISOSpeedRatings',
               'PhotographicSensitivity', 'ExposureProgram', 'ExposureMode', 'ExposureCompensation',
               'ExposureBiasValue', 'MeteringMode', 'LightSource', 'Flash', 'FlashMode',
               'FocalLength', 'FocalLengthIn35mmFormat', 'FocalPlaneXResolution', 'FocalPlaneYResolution',
               'WhiteBalance', 'ColorSpace', 'Contrast', 'Saturation', 'Sharpness',
               'DigitalZoomRatio', 'SceneCaptureType', 'SceneType', 'GainControl', 'BrightnessValue',
               'SubjectDistance', 'SubjectDistanceRange', 'MaxApertureValue', 'FocusMode',
               'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'DateTime', 'DateTimeDigitized',
               'SubSecTime', 'SubSecTimeOriginal', 'SubSecTimeDigitized', 'OffsetTime',
               'Orientation', 'XResolution', 'YResolution', 'ResolutionUnit', 'ExifVersion',
               'ExifImageWidth', 'ExifImageHeight', 'PixelXDimension', 'PixelYDimension',
               'SensingMethod', 'FileSource', 'CustomRendered', 'ImageUniqueID',
               'ShutterCount', 'ImageStabilization', 'Quality', 'DriveMode', 'SelfTimer'],
               
        gps: ['GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef', 'GPSAltitude',
              'GPSAltitudeRef', 'GPSTimeStamp', 'GPSDateStamp', 'GPSSpeed', 'GPSSpeedRef',
              'GPSTrack', 'GPSTrackRef', 'GPSImgDirection', 'GPSImgDirectionRef',
              'GPSDestLatitude', 'GPSDestLongitude', 'GPSProcessingMethod', 'GPSAreaInformation',
              'GPSVersionID', 'GPSMapDatum', 'GPSCoordinates', 'GPSMapLink',
              'latitude', 'longitude', 'GPSPosition', 'GPSLatitudeDecimal', 'GPSLongitudeDecimal'],
              
        advanced: ['ProfileDescription', 'ProfileClass', 'ColorSpaceData', 'ProfileConnectionSpace',
                   'ProfileCreator', 'ProfileCopyright', 'RenderingIntent', 'MediaWhitePoint',
                   'ThumbnailOffset', 'ThumbnailLength', 'ThumbnailImage',
                   'Rating', 'RatingPercent', 'Label', 'Title', 'Description', 'Subject',
                   'Creator', 'Rights', 'MetadataDate', 'CreatorTool', 'DocumentID', 'InstanceID',
                   'Headline', 'Caption', 'Keywords', 'City', 'State', 'Country', 'CountryCode',
                   'Location', 'Credit', 'Source', 'CopyrightNotice', 'Contact', 'Writer',
                   'Category', 'Urgency', 'ObjectName', 'DateCreated', 'TimeCreated',
                   'PhotometricInterpretation', 'PlanarConfiguration', 'YCbCrSubSampling',
                   'ComponentsConfiguration', 'CompressedBitsPerPixel', 'InteropIndex',
                   'FlashpixVersion', 'PrintIM', 'ApplicationNotes', 'ICC_Profile', 'XMP']
    };

    // ================== INITIALIZATION ==================
    function initElements() {
        elements = {
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
    }

    function init() {
        console.log('Initializing Image Metadata Tool...');
        initElements();
        bindEvents();
        setupDropzone();
        console.log('Image Metadata Tool initialized successfully!');
    }

    // ================== EVENT BINDINGS ==================
    function bindEvents() {
        // File inputs
        if (elements.fileInput) {
            elements.fileInput.addEventListener('change', handleFileSelect);
            console.log('File input bound');
        }
        if (elements.fileInputNew) {
            elements.fileInputNew.addEventListener('change', handleFileSelect);
        }
        
        // Action buttons
        if (elements.btnRemoveMetadata) {
            elements.btnRemoveMetadata.addEventListener('click', removeMetadata);
        }
        if (elements.btnExportJson) {
            elements.btnExportJson.addEventListener('click', exportAsJson);
        }
        if (elements.btnCopyAll) {
            elements.btnCopyAll.addEventListener('click', copyAllMetadata);
        }
        if (elements.btnCopyGps) {
            elements.btnCopyGps.addEventListener('click', copyGpsCoordinates);
        }
        
        // Tabs
        if (elements.tabs && elements.tabs.length > 0) {
            elements.tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    switchTab(this.dataset.tab);
                });
            });
            console.log('Tabs bound:', elements.tabs.length);
        }
        
        // Search
        if (elements.metadataSearch) {
            elements.metadataSearch.addEventListener('input', searchMetadata);
        }
    }

    // ================== DROPZONE SETUP ==================
    function setupDropzone() {
        const dropzone = elements.dropzone;
        if (!dropzone) {
            console.log('Dropzone not found');
            return;
        }
        
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
        console.log('Dropzone setup complete');
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
            console.log('File selected:', file.name);
            processFile(file);
        }
    }

    async function processFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file');
            return;
        }

        console.log('Processing file:', file.name, file.type, file.size);
        
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
                console.log('Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                
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

                // Extract raw binary data for format-specific info
                extractRawBinaryData(arrayBuffer, file.type);

                // Process GPS data
                processGpsData();

                console.log('Total metadata fields:', Object.keys(currentMetadata).length);

                // Update UI
                updateUI();
                showLoading(false);

                // Switch to viewer page
                showPage('viewer');
            };
            img.onerror = function() {
                console.error('Error loading image');
                showLoading(false);
                showToast('Error loading image');
            };
            img.src = imageUrl;

        } catch (error) {
            console.error('Error processing file:', error);
            showLoading(false);
            showToast('Error processing image: ' + error.message);
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
                console.error('EXIFR library not loaded!');
                showToast('Metadata library not loaded. Please refresh.');
                return;
            }

            console.log('Starting EXIFR extraction...');

            // Extract ALL metadata with all segments enabled
            const options = {
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
                translateKeys: true,
                translateValues: true,
                reviveValues: true,
                sanitize: false,
                mergeOutput: true
            };

            // Try full parse
            let fullData = null;
            try {
                fullData = await exifr.parse(file, options);
                console.log('EXIFR parse result:', fullData);
            } catch (e) {
                console.log('Full parse error:', e.message);
            }

            if (fullData) {
                Object.keys(fullData).forEach(key => {
                    const value = fullData[key];
                    if (value !== undefined && value !== null && value !== '') {
                        if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
                            currentMetadata[key] = '[Binary Data]';
                        } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                            currentMetadata[key] = JSON.stringify(value);
                        } else {
                            currentMetadata[key] = value;
                        }
                        allRawMetadata[key] = value;
                    }
                });
                console.log('Extracted fields from EXIFR:', Object.keys(fullData).length);
            } else {
                console.log('No EXIF data found in image');
            }

            // Also try to get GPS separately
            try {
                const gpsData = await exifr.gps(file);
                if (gpsData) {
                    console.log('GPS data found:', gpsData);
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
                        }
                    } catch (e) {}
                }
                
                // SOF markers - Frame info
                if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xCB)) {
                    try {
                        const precision = dataView.getUint8(offset + 4);
                        const components = dataView.getUint8(offset + 9);
                        
                        currentMetadata.JPEGPrecision = precision + ' bits';
                        currentMetadata.ColorComponents = components + (components === 1 ? ' (Grayscale)' : components === 3 ? ' (RGB/YCbCr)' : components === 4 ? ' (CMYK)' : '');
                        
                        const compressionTypes = {
                            0xC0: 'Baseline DCT',
                            0xC1: 'Extended Sequential DCT',
                            0xC2: 'Progressive DCT'
                        };
                        currentMetadata.JPEGCompression = compressionTypes[marker] || 'DCT';
                    } catch (e) {}
                }
                
                if (marker === 0xDA || marker === 0xD9) break;
                offset += segmentLength + 2;
            } catch (e) {
                break;
            }
        }
    }

    function extractPngInfo(dataView) {
        try {
            const ihdrType = dataView.getUint32(12);
            
            if (ihdrType === 0x49484452) {
                const bitDepth = dataView.getUint8(24);
                const colorType = dataView.getUint8(25);
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
                currentMetadata.PNGInterlace = interlace === 0 ? 'None' : 'Adam7 interlace';
            }
        } catch (error) {
            console.log('PNG extraction error:', error);
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
            
            const packed = dataView.getUint8(10);
            const hasGlobalColorTable = (packed & 0x80) !== 0;
            const globalColorTableSize = 2 << (packed & 0x07);
            
            currentMetadata.GIFHasGlobalColorTable = hasGlobalColorTable ? 'Yes' : 'No';
            currentMetadata.GIFColorTableSize = globalColorTableSize + ' colors';
        } catch (e) {
            console.log('GIF extraction error:', e);
        }
    }

    // ================== GPS PROCESSING ==================
    function processGpsData() {
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
                if (altRef === 1 || altRef === '1') {
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
        
        if (ref === 'S' || ref === 'W') {
            decimal = -decimal;
        }
        
        return decimal;
    }

    // ================== UI UPDATE ==================
    function updateUI() {
        console.log('Updating UI with', Object.keys(currentMetadata).length, 'fields');
        
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
        const cameraText = (make + ' ' + model).trim() || '-';
        if (elements.statCamera) {
            elements.statCamera.textContent = cameraText;
            console.log('Camera stat:', cameraText);
        }
        
        // Date
        const dateOriginal = currentMetadata.DateTimeOriginal || currentMetadata.CreateDate || currentMetadata.DateTime || currentMetadata.ModifyDate;
        const dateText = dateOriginal ? formatExifDate(dateOriginal) : '-';
        if (elements.statDate) {
            elements.statDate.textContent = dateText;
            console.log('Date stat:', dateText);
        }
        
        // Lens
        const lensText = currentMetadata.LensModel || currentMetadata.Lens || currentMetadata.LensInfo || '-';
        if (elements.statLens) {
            elements.statLens.textContent = lensText;
            console.log('Lens stat:', lensText);
        }
        
        // Settings
        const fNumber = currentMetadata.FNumber ? (typeof currentMetadata.FNumber === 'number' ? `f/${currentMetadata.FNumber}` : currentMetadata.FNumber) : '';
        const exposure = currentMetadata.ExposureTime ? formatExposure(currentMetadata.ExposureTime) : '';
        const iso = currentMetadata.ISO || currentMetadata.ISOSpeedRatings || '';
        const focalLength = currentMetadata.FocalLength ? (typeof currentMetadata.FocalLength === 'number' ? `${currentMetadata.FocalLength}mm` : currentMetadata.FocalLength) : '';
        
        const settingsParts = [fNumber, exposure, iso ? `ISO ${iso}` : '', focalLength].filter(Boolean);
        const settingsText = settingsParts.join(' • ') || '-';
        if (elements.statSettings) {
            elements.statSettings.textContent = settingsText;
            console.log('Settings stat:', settingsText);
        }
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
        console.log('Populating metadata tables...');
        
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
            const tableKey = `table${category.charAt(0).toUpperCase() + category.slice(1)}`;
            const table = elements[tableKey];
            
            if (table) {
                const formattedValue = formatValue(key, value);
                const row = createMetadataRow(key, formattedValue);
                table.appendChild(row);
                counts[category]++;
                totalCount++;
                processed.add(key);
            }
        });
        
        console.log('Metadata counts:', counts, 'Total:', totalCount);
        
        // Update counts
        if (elements.countBasic) elements.countBasic.textContent = `${counts.basic} fields`;
        if (elements.countCamera) elements.countCamera.textContent = `${counts.camera} fields`;
        if (elements.countExif) elements.countExif.textContent = `${counts.exif} fields`;
        if (elements.countGps) elements.countGps.textContent = `${counts.gps} fields`;
        if (elements.countAdvanced) elements.countAdvanced.textContent = `${counts.advanced} fields`;
        if (elements.totalFields) elements.totalFields.textContent = `${totalCount} metadata fields extracted`;
        
        // Show/hide empty groups
        if (elements.metadataGroups) {
            elements.metadataGroups.forEach(group => {
                const table = group.querySelector('.metadata-table');
                group.style.display = (table && table.children.length > 0) ? 'block' : 'none';
            });
        }
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
        if (keyLower.includes('file') || (keyLower.includes('image') && (keyLower.includes('width') || keyLower.includes('height') || keyLower.includes('size')))) return 'basic';
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
        const copyBtn = row.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                navigator.clipboard.writeText(String(value)).then(() => {
                    showToast('Copied!');
                });
            });
        }
        
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
        console.log('Switching to tab:', tab);
        
        // Update tab buttons
        if (elements.tabs) {
            elements.tabs.forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tab);
            });
        }
        
        // Show/hide groups
        if (elements.metadataGroups) {
            elements.metadataGroups.forEach(group => {
                const categories = group.dataset.category ? group.dataset.category.split(' ') : [];
                const table = group.querySelector('.metadata-table');
                
                if (table && table.children.length > 0) {
                    if (tab === 'all' || categories.includes(tab)) {
                        group.classList.remove('hidden');
                        group.style.display = 'block';
                    } else {
                        group.classList.add('hidden');
                        group.style.display = 'none';
                    }
                }
            });
        }
    }

    // ================== SEARCH ==================
    function searchMetadata() {
        const query = elements.metadataSearch ? elements.metadataSearch.value.toLowerCase().trim() : '';
        const rows = document.querySelectorAll('.metadata-row');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const key = row.dataset.key || '';
            const value = row.dataset.value || '';
            
            if (query === '' || key.includes(query) || value.includes(query)) {
                row.classList.remove('hidden');
                row.style.display = '';
                visibleCount++;
            } else {
                row.classList.add('hidden');
                row.style.display = 'none';
            }
        });
        
        if (elements.searchCount) {
            elements.searchCount.textContent = query ? `${visibleCount} found` : '';
        }
        
        // Show/hide empty groups
        if (elements.metadataGroups) {
            elements.metadataGroups.forEach(group => {
                const table = group.querySelector('.metadata-table');
                if (table) {
                    const visibleRows = table.querySelectorAll('.metadata-row:not(.hidden)');
                    group.style.display = visibleRows.length > 0 ? 'block' : 'none';
                }
            });
        }
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
        console.log('Showing page:', page);
        
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
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
