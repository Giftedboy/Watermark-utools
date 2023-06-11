const size = require("image-size");
const ExifReader = require("exifreader");
const Jimp = require("jimp");
const { parse, format } = require('date-fns');

const JPEG = require("jpeg-js");

Jimp.decoders["image/jpeg"] = (data) =>
  JPEG.decode(data, {
    maxMemoryUsageInMB: 6144,
    maxResolutionInMP: 600,
  });

var sign = ""

const mode = [
  {
    title: 'Normal',
    description: '普通样式'
  },
  {
    title: 'Center',
    description: '居中样式'
  }
]



const style = {
  Normal: {
    Name: "Normal",
    WatermarkWidth: 8000,
    WatermarkHeight: 500,
    LensModelTextPosition: { x: 150, y: 100 },
    DetailTextPosition: { x: 6000, y: 100 },
    MakeTextPosition: { x: 150, y: 275 },
    TimeTextPosition: { x: 6000, y: 275 },
    LinePosition: { margin: 50 },
    LogoPosition: { height: 450 },
    SignPosition: { x: 3000, y: 230 }
  },
  Center: {
    WatermarkWidth: 8000,
    WatermarkHeight: 1000,
    LinePosition: { margin: 50 },
    LogoPosition: { height: 800 },
    TextPosition: { y: 100 },
    Name: "Center",
  }
}

window.exports = {
  WaterMark: {
    mode: "list",
    args: {
      enter: (action, callbackSetList) => {
        callbackSetList(mode)
      },
      search: (action, searchWord, callbackSetList) => {
        sign = searchWord;
      },
      select: (action, itemData, callbackSetList) => {
        window.utools.showNotification("文件将保存到桌面，完成后自动打开文件夹。file saved at " + window.utools.getPath("desktop"));
        var config;
        switch (itemData.title) {
          case "Normal": {
            config = style.Normal
            break;
          }
          case "Center": {
            config = style.Center
            break;
          }
        }
        let files = action.payload
        files.forEach(file => {
          if (file.isFile) {
            getExif(file.path)
              .then((exif) => {
                try {
                  createWaterMark(
                    exif,
                    file.path,
                    file.name,
                    config
                  );
                } catch (e) {
                  writeLog(e.message);
                }
              })
              .catch((e) => {
                writeLog(e.message);
              });
          }
        });

        window.utools.hideMainWindow()

      },

      placeholder: "输入用于签名"
    }
  }
}

function writeLog(logMessage) {
  const fs = require("fs");
  const logFile = window.utools.getPath("desktop") + "/logs.txt";
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp}: ${logMessage}\n`;
  fs.appendFile(logFile, logLine, function (err) {
    if (err) throw err;
    window.utools.showNotification(err.message);
    console.log("Log written to file");
  });
}

function calcLogoWidth(path, targetHeight) {
  try {
    dimensions = size(path);
    console.log(dimensions);
    return (targetHeight / dimensions.height) * dimensions.width;
  } catch (e) {
    return e.message;
  }
}

function getExif(path) {
  return new Promise((resolve, reject) => {
    try {
      ExifReader.load(path, { expanded: true }).then(function (tags) {
        const dateObject = parse(tags.exif.DateTimeOriginal.description, 'yyyy:MM:dd HH:mm:ss', new Date());
        const formattedDate = format(dateObject, 'yyyy-MM-dd HH:mm');
        var keyExif = {
          Make: tags.exif.Make.description.toLowerCase(),
          Model: tags.exif.Model.description,
          ISO: tags.exif.ISOSpeedRatings.description,
          ExposureTime: tags.exif.ExposureTime.description,
          FNumber: tags.exif.FNumber.description,
          CreateDate: formattedDate,
          LensModel: tags.exif.LensModel.description,
          FocalLength: tags.exif.FocalLength.description,
          Width: tags.file["Image Width"].value,
          Height: tags.file["Image Height"].value,
        };
        resolve(keyExif);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function line(image, from, to) {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;

  let err = dx - dy;
  let x = from.x,
    y = from.y;

  while (x !== to.x || y !== to.y) {
    image.setPixelColor(0x0000ff, x, y);
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function createWaterMark(exifData, path, name, config) {

  let Make = exifData.Make;
  switch (true) {
    case Make.indexOf("nikon") != -1: {
      exifData.Make = exifData.Model;
      exifData.logo = __dirname + "/logos/nikon.png";
      break;
    }
    case Make.indexOf("sony") != -1: {
      exifData.Make = "Sony " + exifData.Model;
      exifData.logo = __dirname + "/logos/sony.png";
      break;
    }
    case Make.indexOf("apple") != -1: {
      exifData.Make = exifData.Model;
      exifData.logo = __dirname + "/logos/apple.png";
      break;
    }
    case Make.indexOf("canon") != -1: {
      exifData.Make = exifData.Model;
      exifData.logo = __dirname + "/logos/canon.png";
      break;
    }
    case Make.indexOf("fujifilm") != -1: {
      exifData.Make = "Fujifilm " + exifData.Model;
      exifData.logo = __dirname + "/logos/fujifilm.png";
      break;
    }
    case Make.indexOf("leica") != -1: {
      exifData.Make = exifData.Model;
      exifData.logo = __dirname + "/logos/leica_logo.png";
      break;
    }
    case Make.indexOf("hasselblad") != -1: {
      exifData.Make = "Hasselblad " + exifData.Model;
      exifData.logo = __dirname + "/logos/hasselblad.png";
      break;
    }
    case Make.indexOf("olympus") != -1: {
      exifData.Make = "Olympus " + exifData.Model;
      exifData.logo = __dirname + "/logos/olympus_blue_gold.png";
      break;
    }
    case Make.indexOf("panasonic") != -1: {
      exifData.Make = "Lumix " + exifData.Model;
      exifData.logo = __dirname + "/logos/panasonic.png";
      break;
    }
    case Make.indexOf("pentax") != -1: {
      exifData.Make = exifData.Model;
      exifData.logo = __dirname + "/logos/pentax.png";
      break;
    }
    case Make.indexOf("ricoh") != -1: {
      exifData.Make = exifData.Model;
      exifData.logo = __dirname + "/logos/ricoh.png";
      break;
    }
    default: {
      exifData.Make = "Unkonw " + exifData.Model;
      exifData.logo = __dirname + "/logo.png";
    }
  }

  switch (config.Name) {
    case 'Normal': {
      DrawNormalWatermark(exifData, path, name, config)
      break;
    }
    case 'Center': {
      DrawCenterWatermark(exifData, path, name, config)
      break;
    }
  }
}


function DrawNormalWatermark(exifData, path, name, config) {
  //固定水印长度、宽度
  let width = config.WatermarkWidth;
  let height = config.WatermarkHeight;


  const bgColor = 0xffffffff;
  const watermarkimg = new Jimp(width, height, bgColor);


  const LensModelTextPosition = config.LensModelTextPosition;
  const DetailTextPosition = config.DetailTextPosition;
  const MakeTextPosition = config.MakeTextPosition;
  const TimeTextPosition = config.TimeTextPosition;

  // Jimp.HORIZONTAL_ALIGN_CENTER

  Jimp.loadFont(__dirname + "/fonts/roboto-150-bold.fnt").then((font) => {
    //绘制镜头类型
    watermarkimg.print(
      font,
      LensModelTextPosition.x,
      LensModelTextPosition.y,
      exifData.LensModel
    );

    let Detail = exifData.FocalLength.replaceAll(" ", "") + " " + exifData.FNumber + " " + exifData.ExposureTime + " ISO" + exifData.ISO;
    let DetailWidth = Jimp.measureText(font, Detail)
    //绘制焦距、光圈、快门、iso
    watermarkimg.print(
      font,
      width - DetailWidth - 100,
      DetailTextPosition.y,
      Detail
    );

    //绘制签名
    if (sign != '') {
      SignWitdth = Jimp.measureText(font, sign)
      const x = (width - SignWitdth) / 2;
      watermarkimg.print(
        font,
        x,
        175,
        sign
      );
    }


    //绘制分割线
    line(
      watermarkimg,
      { x: width - DetailWidth - 100 - 50, y: config.LinePosition.margin },
      { x: width - DetailWidth - 100 - 50, y: height - config.LinePosition.margin }
    );

    Jimp.loadFont(__dirname + "/fonts/roboto-150-thin.fnt").then((font2) => {
      //使用新字体大小绘制相机品牌
      watermarkimg.print(font2, MakeTextPosition.x, MakeTextPosition.y, exifData.Make);
      //绘制时间
      watermarkimg.print(font2, width - DetailWidth - 100, TimeTextPosition.y, exifData.CreateDate);

      //绘制logo

      Jimp.read(exifData.logo).then((logoimg) => {
        //{ height: 450, x: 6000 - 200 - calcLogoWidth(450), y: 25 },
        const LogoPosition = config.LogoPosition
        let w = calcLogoWidth(exifData.logo, LogoPosition.height)
        logoimg.resize(w, LogoPosition.height)
        // const LogoPosition = { x: width - 2200 - 200 - w, y: 25 }
        watermarkimg.blit(logoimg, width - DetailWidth - 100 - 100 - w, (height - LogoPosition.height) / 2)

        //resize水印之后 合并主图
        watermarkimg.resize(exifData.Width, height * exifData.Width / width)
        //创建新的图片用于合并
        const TargetImg = new Jimp(exifData.Width, exifData.Height + height * exifData.Width / width, bgColor);

        Jimp.read(path).then((originImg) => {

          TargetImg.blit(originImg, 0, 0)
          TargetImg.blit(watermarkimg, 0, exifData.Height)
          TargetImg.write(window.utools.getPath("desktop") + "/" + name + "-withWatermark.jpg");
        }).catch((e) => {
          window.utools.showNotification(e.message)
          writeLog(e.message)
        })
      }).catch((e) => {
        window.utools.showNotification(e.message)
        writeLog(e.message)
      })
    }).catch((e) => {
      window.utools.showNotification(e.message)
      writeLog(e.message)
    });
  }).catch((e) => {
    window.utools.showNotification(e.message)
    writeLog(e.message)
  });
}

function DrawCenterWatermark(exifData, path, name, config) {
  let width = config.WatermarkWidth;
  let height = config.WatermarkHeight;


  const bgColor = 0xffffffff;
  const watermarkimg = new Jimp(width, height, bgColor);

  let center = Math.ceil(width / 2)

  //先划中线
  let LinePosition = config.LinePosition;

  line(watermarkimg, { x: center, y: LinePosition.margin }, { x: center, y: height - LinePosition.margin })



  Jimp.read(exifData.logo).then((logoimg) => {

    //绘制左侧logo
    const LogoPosition = config.LogoPosition
    let w = calcLogoWidth(exifData.logo, LogoPosition.height)
    logoimg.resize(w, LogoPosition.height)
    watermarkimg.blit(logoimg, center - w - 50, (height - LogoPosition.height) / 2)

    //绘制右侧文字
    Jimp.loadFont(__dirname + "/fonts/roboto-150-bold.fnt").then((font) => {
      TextPosition = config.TextPosition


      //品牌
      watermarkimg.print(font, center + 150, TextPosition.y, exifData.Make);

      //detail
      let Detail = exifData.FocalLength.replaceAll(" ", "") + " " + exifData.FNumber + " " + exifData.ExposureTime + " ISO" + exifData.ISO;
      watermarkimg.print(font, center + 150, TextPosition.y + 175, Detail)


      Jimp.loadFont(__dirname + "/fonts/roboto-150-thin.fnt").then((font2) => {
        //镜头
        watermarkimg.print(
          font2,
          center + 150,
          TextPosition.y + 175 + 175 + 25,
          exifData.LensModel
        );
        //时间
        watermarkimg.print(font2, center + 150, TextPosition.y + 175 + 175 + 175 + 25, exifData.CreateDate);


        //右下角签名
        if (sign != '') {
          let SignWidth = Jimp.measureText(font2, sign)
          watermarkimg.print(font2, width - SignWidth - 25, height - 175, sign);
        }

        watermarkimg.resize(exifData.Width, height * exifData.Width / width)

        const TargetImg = new Jimp(exifData.Width, exifData.Height + height * exifData.Width / width, bgColor);

        Jimp.read(path).then((originImg) => {

          TargetImg.blit(originImg, 0, 0)
          TargetImg.blit(watermarkimg, 0, exifData.Height)
          TargetImg.write(window.utools.getPath("desktop") + "/" + name + "-withCenterWatermark.jpg");

          window.utools.shellOpenPath(window.utools.getPath("desktop"))
        }).catch((e) => {
          window.utools.showNotification(e.message)
          writeLog(e.message)
        })
      }).catch((e) => {
        window.utools.showNotification(e.message)
        writeLog(e.message)
      })

    }).catch((e) => {
      window.utools.showNotification(e.message)
      writeLog(e.message)
    })


  })


}