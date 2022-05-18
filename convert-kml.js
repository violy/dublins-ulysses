const parseKML = require('parse-kml');
const fs = require('fs');

const parts = [
    {id:1,name:'Part I',kml:'UlyssesPart1.kml'},
    {id:2,name:'Part II',kml:'UlyssesPart2.kml'},
]

const parseKmlPart = (part)=>{
    parseKML.toJson(part.kml).then(jsonKML=>{
        jsonKML.features.forEach((feature,i)=>{
            const {properties, geometry} = feature
            const {type} = geometry
            const {name,description=''} = properties
            let markdown = '---';
            markdown += `\ntitle: ${name}`;
            markdown += `\npart: ${part.id}`;
            markdown += `\nepisode: 0`;
            markdown += `\npages: [0]`;
            //markdown += `\ndatetime: 1904-06-16T00:00:00`;
            switch(type){
                case 'Point':
                    markdown += `\ntype: Marker`;
                    markdown += `\npoint: ${JSON.stringify(geometry.coordinates)}`;
                    break;
                case 'LineString':
                    markdown += `\ntype: Path`;
                    markdown += `\nlinestring: ${JSON.stringify(geometry.coordinates)}`;
                    break;
                default:
                    console.log(type)
            }
            markdown += `\n---`;
            markdown += `\n${description}`;
            const noteNumber = `${(i+1).toString().padStart(3,'0')}_`
            if(!fs.existsSync(`./notes/${part.name}`)) fs.mkdirSync(`./notes/${part.name}`);
            fs.writeFileSync(`./notes/${part.name}/${noteNumber}${name}.md`,markdown)
        })
    })
}
parts.forEach(parseKmlPart)
