# -*- Coding: UTF-8 -*-
#coding: utf-8

'exec(%matplotlib inline)'
from imageai.Detection.Custom import CustomObjectDetection
from prettytable import PrettyTable
import json, shutil, os, numpy as np, skimage.io, matplotlib.pyplot as plt, skimage.segmentation, cv2


# CRIANDO AS PASTAS


pathIMG, dirsIMG, filesIMG = next(os.walk(os.path.join("server", "images")))
path, dirs, files = next(os.walk(os.path.join("server","corridas")))

if( len(filesIMG) == len(dirs) ):
  print("Não há mais imagem para treinar. Por favor insira mais imagens na pasta 'server/images'")
else:
  file_count_corridas = len(dirs) 
  if(file_count_corridas == 0):
    print("Número de corridas na pasta: ", file_count_corridas)
    file_count_corridas = 1
  else:
    print("Número de corridas na pasta: ", file_count_corridas)
    file_count_corridas = len(dirs) + 1

  newFolderCorrida = str(file_count_corridas)
  folderCorrida = "server/corridas/Corrida_" + newFolderCorrida
  print("..")
  print("..")
  print("..")
  os.mkdir(folderCorrida)
  print("Criando pasta 'Corrida_"+newFolderCorrida+"'")

  folderTagsJson = "server/corridas/Corrida_" + newFolderCorrida + "/tags_json"
  print("..")
  print("..")
  print("..")
  try:
    os.mkdir(folderTagsJson)
    print("Criando pasta '/tags_json'")
  except:
    print("Já existe a pasta '/tags_json'")

  folderTagsDetected = "server/corridas/Corrida_" + newFolderCorrida + "/tags_detected"
  print("..")
  print("..")
  print("..")
  try:
    os.mkdir(folderTagsDetected)
    print("Criando pasta '/tags_detected'")
  except:
    print("Já existe a pasta '/tags_detected'")

  print("..")
  print("..")
  print("..")
  try:
    os.mkdir("barcode-detected-objects")
    print("Criando pasta '/barcode-detected-objects'")
  except:
    print("Já existe a pasta '/barcode-detected-objects'")


# setando as variaveis
modelPath = "server/config/models/barcode/detection_model-ex-013--loss-0001.995.h5"
JsonPath = "server/config/json/detection_config_barcode.json"

Image_Number = newFolderCorrida
InputImage = "server/images/img"+ Image_Number +".jpg"



## 3. Função de interseção sobre união e Função de eliminar quadrados sobrepostos.

def bb_intersection_over_union(boxA, boxB):
	xA = max(boxA[0], boxB[0])
	yA = max(boxA[1], boxB[1])
	xB = min(boxA[2], boxB[2])
	yB = min(boxA[3], boxB[3])
	interArea = max(0, xB - xA + 1) * max(0, yB - yA + 1)
	boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
	boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)
	iou = interArea / float(boxAArea + boxBArea - interArea)
	return iou

def boxArea(boxA, boxB):
	boxAArea = (boxA[2] - boxA[0] + 1) * (boxA[3] - boxA[1] + 1)
	boxBArea = (boxB[2] - boxB[0] + 1) * (boxB[3] - boxB[1] + 1)
	return boxAArea/boxBArea

def removeDuplicatesLoop(detections):
	i=0
	k=0
	for i, detection in enumerate(detections):
		for k, detection in enumerate(detections):
					inter = bb_intersection_over_union(detections[i]["box_points"] , detections[k]["box_points"])
					if(inter > float(0.01) and inter < float(1)):
						if(boxArea(detections[i]["box_points"] , detections[k]["box_points"]) > 1):
							detections.pop(k)
						else:
							detections.pop(i)
							removeDuplicatesLoop(detections)



#treinando o modelo e recortando os barcodes do original]


if( len(filesIMG) == len(dirs) ):
  print("Não há mais imagem para treinar. Por favor insira mais imagens na pasta '/Imagens_Originais'")
else:
  detector = CustomObjectDetection()
  detector.setModelTypeAsYOLOv3()
  detector.setModelPath(modelPath)
  detector.setJsonPath(JsonPath)
  detector.loadModel()

  detections = detector.detectObjectsFromImage(input_image = InputImage, 
                                                            output_image_path="barcode-detected-OriginalBoxes.jpg",
                                                            minimum_percentage_probability=30)
  for e in detections:
    e['box_points'][0] = e['box_points'][0] - 50 ## x1
    e['box_points'][1] = e['box_points'][1] - 50 ## y1
    e['box_points'][2] = e['box_points'][2] + 50 ## x2
    e['box_points'][3] = e['box_points'][3] + 50 ## y2

  removeDuplicatesLoop(detections)

  header = PrettyTable(["Nome", "Porcentagem ", "box_points"])
  for detection in detections:
    header.add_row([detection["name"], detection["percentage_probability"], detection["box_points"]])

  img = PrettyTable(["                 Barcodes identificados                 "])
  img.add_row([len(detections)])

  print("")
  print("")
  print(header)
  print("")
  print(img)
  print("")


# 5. Identificando as novas Bounding Box, recortando da imagem original e exportando os arquivos para pasta "/tags_images




if( len(filesIMG) == len(dirs) ):
  print("Não há mais imagem para treinar. Por favor insira mais imagens na pasta '/Imagens_Originais'")
else:
  Image_with_boxes = "barcode-detected-OriginalBoxes.jpg"

  img = skimage.io.imread(InputImage)
  bbox = []

  for e in detections:
      bbox.append(e['box_points'])

  for i, (x1,y1,x2,y2) in enumerate(bbox):

      if i in {0,1,2,3,4,5,6,7,8,9}:
        i = '00' + str(i)
      
      if(int(i) > 9 and int(i) < 100):
        i = '0' + str(i)

      img2 = cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 0)
      out = img[y1:y2, x1:x2]

      cv2.imwrite('barcode-detected-objects/barcode-00'+str(i)+'.jpg', out)

  cv2.imwrite('barcode-detected-New.jpg', img)

  print("Boxes recortados com sucesso!")
  print("..")
  print("..")
  print("..")
  print("Imagem = 'barcode-detected-New.jpg' gerada.")

# 6. Movendo as pastas para o diretório correto. ##

if( len(filesIMG) == len(dirs) ):
  print("Não há mais imagem para treinar. Por favor insira mais imagens na pasta '/Imagens_Originais'")
else:
  shutil.move("barcode-detected-OriginalBoxes.jpg", folderCorrida)
  shutil.move("barcode-detected-New.jpg", folderCorrida)
  shutil.move("barcode-detected-objects", folderCorrida)

  barcode = "server/corridas/Corrida_" + newFolderCorrida + "/barcode-detected-objects"
  images = "server/corridas/Corrida_" + newFolderCorrida + "/tags_images"
  shutil.move(barcode, images)

  print("Pastas movidas para o drive com sucesso!")


# conta num arquivos na pasta
pathIMG, dirsIMG, filesIMG = next(os.walk(os.path.join("server","images")))
root, dirs, files = next(os.walk(os.path.join("server","corridas")))

pasta = PrettyTable(["Corridas na pasta", "Status"])
for i in range(0, len(dirs)):
  pathJSON, dirsJSON, filesJSON = next(os.walk(os.path.join("server","corridas","Corrida_"+str(i+1),"tags_json")))
  if(len(filesJSON)>0):
    status = "Treinada"
  else:
    status = "Ainda não treinada"
  pasta.add_row(["Corrida_"+str(i+1), status])

print("")
print(pasta)
print("")
print("")
print("Qual corrida deseja identificar os codigos de barras? (Informe o número da pasta)")
corrida = Image_Number
print("corrida", corrida)
print("")

path, dirs, files = next(os.walk(os.path.join("server","corridas","Corrida_" + str(corrida), "tags_images")))
file_count_tag = len(files)
tags = PrettyTable(["Treinar", "Tags"])
tags.add_row(["Corrida_"+str(corrida), str(file_count_tag)])

print("")
print(tags)
print("")


#funcao agrupar num

def removeDuplicates():
    i=0
    for detection in detections:
      if( i != len(detections)-1 ):
          
          Xa = (detections[i]['box_points'][0] + detections[i]['box_points'][2])/2
          Ya = (detections[i]['box_points'][1] + detections[i]['box_points'][3])/2
          Xb = (detections[i+1]['box_points'][0] + detections[i+1]['box_points'][2])/2
          Yb = (detections[i+1]['box_points'][1] + detections[i+1]['box_points'][3])/2

          Dab = ( (Xb-Xa)**2 + (Yb - Ya)**2 )**1/2
          if(Dab < float(10)):
              if(detections[i]["percentage_probability"] < detections[i+1]["percentage_probability"]):
                  detections.pop(i)
              else:
                  detections.pop(i+1)
      i=i+1


#num detect


modelPath = "server/config/models/number/detection_model-ex-034--loss-0012.508.h5"
JsonPath = "server/config/json/detection_config_number.json"

detector = CustomObjectDetection()
detector.setModelTypeAsYOLOv3()
detector.setModelPath(modelPath)
detector.setJsonPath(JsonPath)
detector.loadModel()

avgCorrida = 0

for x in range(file_count_tag):

  i=0
  soma=0
  numero=''
  execucoes = 0

  if x in {0,1,2,3,4,5,6,7,8,9}:
    x = '00' + str(x)
  
  if(int(x) > 9 and int(x) < 100):
    x = '0' + str(x)

  detections = detector.detectObjectsFromImage(input_image="server/corridas/Corrida_"+str(corrida)+"/tags_images/barcode-00"+str(x)+".jpg", 
                                          output_image_path="server/corridas/Corrida_"+str(corrida)+"/tags_detected/digit-detected-"+str(x)+".jpg", 
                                          display_percentage_probability=False, 
                                          minimum_percentage_probability=60)
  def boxPoints(e):
    return e['box_points']

  detections.sort(key=boxPoints)

  menor = 100
  while(len(detections) > 13):
    execucoes = execucoes + 1
    if(execucoes>10000):
      for i, detection in enumerate(detections):
        if(menor > detections[i]["percentage_probability"]):
          menor = detections[i]["percentage_probability"]   
      for k, detection in enumerate(detections):
        if(detections[k]["percentage_probability"] == menor):
          detections.pop(k)
      break
    removeDuplicates()

  img = PrettyTable(["                     Imagem                    "])
  img.add_row([x])
  header = PrettyTable(["Número", "Porcentagem ", "box_points"])
  alert = ''
  for i in range(len(detections)):
    if(detections[i]["percentage_probability"] < 99):
      detections[i].update({"alert" : "true"})
      alert = "true"
    else:
      detections[i].update({"alert" : "false"})
      alert = "false"
    header.add_row([detections[i]["name"], detections[i]["percentage_probability"], detections[i]["box_points"]])
    soma = soma + detections[i]["percentage_probability"]
    numero = numero + ''.join(detections[i]["name"])

  if(len(detections) != 0):
    avg = soma/len(detections)
  table = PrettyTable(["Números", "Quantidade", "Média"])
  table.add_row([numero, len(detections), avg])


  print("")
  print("")
  print(img)
  print("")
  print(header)
  print("")
  print(table)
  print("")
  print("")
  print("============================================================")
  
  avgCorrida = avgCorrida + avg
  num=numero
  config = {
      "num": num,
      "id": x,
      "acc": avg,
      "alert": alert
    }
  detections[:0] = [config]

  with open('server/corridas/Corrida_'+str(corrida)+'/tags_json/tag-'+ str(x) +'.json', 'w', encoding='utf-8') as f:
    json.dump(detections, f, ensure_ascii=False, indent=4)


#config_x.json

avgCorrida = avgCorrida/float(file_count_tag)


config = {
    "numCorrida": num,
    "Status": "Inadimplente",
    "acc": avgCorrida,
    "qte": file_count_tag
}

with open('server/corridas/Corrida_'+str(corrida)+'/config_'+str(corrida)+'.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=4)



config = "server/corridas_config/config"
check = 'server/corridas/Corrida_'+str(corrida)+'/config_'+str(corrida)+'.json'

shutil.move(check, config)